import { buildPackManifest, selectPackAssets } from "./catalog.ts";
import { generateOfflineZip, generatePackPdf } from "./generator.ts";
import { acquireJobLease, commerceDb, getExportJob, markJobFailed, markJobReady } from "./storage.ts";
import { sha256Hex } from "./signer.ts";

export type CommercialQueueMessage = { jobId: string };
export type CommercialWorkerEnv = Pick<CloudflareEnv, "LEARNING_DB" | "COMMERCIAL_EXPORTS_R2">;
const FONT_OBJECT_KEY = "system/fonts/HskKitSansSubset.ttf";
const EMOJI_FONT_OBJECT_KEY = "system/fonts/HskKitEmoji.ttf";

async function accountExport(userId: string, env: CommercialWorkerEnv) {
  const db = commerceDb(env); const ownerId = `user:${userId}`;
  const [account, learning, plans, aiOperations, aiQuota, requests, audit, orders, entitlements, exports] = await Promise.all([
    db.prepare(`SELECT user_id,display_name,timezone,status,created_at,updated_at FROM accounts WHERE user_id=?`).bind(userId).first(),
    db.prepare(`SELECT revision,state_json,updated_at FROM learning_states WHERE owner_id=?`).bind(ownerId).first(),
    db.prepare(`SELECT version,status,goal_level,target_date,weekly_minutes,preferred_days_json,weak_points_json,warnings_json,sessions_json,created_at FROM study_plan_versions WHERE owner_id=? ORDER BY version`).bind(ownerId).all(),
    db.prepare(`SELECT feature,status,quota_period,cost_units,failure_code,created_at,updated_at FROM ai_operations WHERE owner_id=? ORDER BY created_at`).bind(ownerId).all(),
    db.prepare(`SELECT period_key,allowance,used,reserved,updated_at FROM ai_quota_buckets WHERE owner_id=? ORDER BY period_key`).bind(ownerId).all(),
    db.prepare(`SELECT id,type,state,requested_at,completed_at,failure_code FROM account_data_requests WHERE user_id=? ORDER BY requested_at`).bind(userId).all(),
    db.prepare(`SELECT action,resource_type,resource_id,result,created_at FROM account_audit WHERE user_id=? ORDER BY created_at`).bind(userId).all(),
    db.prepare(`SELECT id,sku,amount_cents,currency,status,created_at,paid_at,refunded_at FROM commerce_orders WHERE user_id=? ORDER BY created_at`).bind(userId).all(),
    db.prepare(`SELECT id,sku,status,starts_at,expires_at,successful_downloads,download_limit FROM commercial_entitlements WHERE user_id=? ORDER BY starts_at`).bind(userId).all(),
    db.prepare(`SELECT id,kind,format,level,state,generation_version,created_at,completed_at,expires_at FROM commercial_export_jobs WHERE user_id=? ORDER BY created_at`).bind(userId).all(),
  ]);
  return new TextEncoder().encode(JSON.stringify({
    schemaVersion: "hskkit-account-export-v2", generatedAt: new Date().toISOString(), account,
    learning: learning ? { ...learning, state_json: JSON.parse(String((learning as Record<string,unknown>).state_json ?? "{}")) } : null,
    plans: plans.results, ai: { operations: aiOperations.results, quota: aiQuota.results }, requests: requests.results,
    audit: audit.results, commerce: { orders: orders.results, entitlements: entitlements.results, exports: exports.results },
  }, null, 2));
}

export async function processCommercialExport(message: CommercialQueueMessage, env: CommercialWorkerEnv) {
  if (!message?.jobId) throw new Error("INVALID_QUEUE_MESSAGE");
  const leaseOwner = crypto.randomUUID();
  if (!await acquireJobLease(message.jobId, leaseOwner, env)) return { skipped: true as const };
  let objectKey: string | null = null;
  try {
    const job = await getExportJob(message.jobId, undefined, env);
    if (!job) throw new Error("EXPORT_NOT_FOUND");
    let entitlement = job.entitlement_id ? await commerceDb(env).prepare(`SELECT expires_at,status FROM commercial_entitlements WHERE id=?`).bind(job.entitlement_id).first<{expires_at:string;status:string}>() : null;
    if (job.entitlement_id && (!entitlement || entitlement.status !== "active")) throw new Error("ENTITLEMENT_REVOKED");
    let bytes: Uint8Array; let manifest: Record<string,unknown>; let extension: string; let contentType: string;
    if (job.kind === "account_data") {
      bytes = await accountExport(job.user_id, env); extension = "json"; contentType = "application/json";
      manifest = { schemaVersion: "hskkit-account-export-manifest-v1", generationVersion: job.generation_version, ownerUserId: job.user_id, format: "json" };
    } else {
      if (!job.level) throw new Error("LEVEL_REQUIRED");
      const selection = selectPackAssets(job.level); const packManifest = buildPackManifest(selection, job.generation_version);
      const expectedManifestJson = JSON.stringify(packManifest);
      let pdf: Uint8Array | null = null;
      if (job.format === "zip") {
        const reusable = await commerceDb(env).prepare(`SELECT object_key FROM commercial_export_jobs WHERE user_id=? AND entitlement_id=? AND kind='pdf_pack' AND format='pdf' AND level=? AND generation_version=? AND state='ready' AND expires_at>? AND manifest_json=? AND object_key IS NOT NULL ORDER BY completed_at DESC LIMIT 1`).bind(job.user_id,job.entitlement_id,job.level,job.generation_version,new Date().toISOString(),expectedManifestJson).first<{object_key:string}>();
        if (reusable?.object_key) {
          const reusableObject = await env.COMMERCIAL_EXPORTS_R2.get(reusable.object_key);
          if (reusableObject) pdf = new Uint8Array(await reusableObject.arrayBuffer());
        }
      }
      if (!pdf) {
        const [fontObject,emojiFontObject] = await Promise.all([
          env.COMMERCIAL_EXPORTS_R2.get(FONT_OBJECT_KEY),
          env.COMMERCIAL_EXPORTS_R2.get(EMOJI_FONT_OBJECT_KEY),
        ]);
        if (!fontObject||!emojiFontObject) throw new Error("EMBEDDED_FONT_NOT_AVAILABLE");
        pdf = await generatePackPdf(selection, packManifest, new Uint8Array(await fontObject.arrayBuffer()), new Uint8Array(await emojiFontObject.arrayBuffer()));
      }
      if (job.format === "zip") { bytes = generateOfflineZip(pdf, packManifest); extension = "zip"; contentType = "application/zip"; }
      else { bytes = pdf; extension = "pdf"; contentType = "application/pdf"; }
      manifest = packManifest as unknown as Record<string,unknown>;
    }
    if (job.entitlement_id) {
      entitlement = await commerceDb(env).prepare(`SELECT expires_at,status FROM commercial_entitlements WHERE id=?`).bind(job.entitlement_id).first<{expires_at:string;status:string}>();
      if (!entitlement || entitlement.status !== "active") throw new Error("ENTITLEMENT_REVOKED");
    }
    const checksumSha256 = await sha256Hex(bytes);
    objectKey = `private/exports/${job.user_id}/${job.id}/hskkit-${job.kind}.${extension}`;
    await env.COMMERCIAL_EXPORTS_R2.put(objectKey, bytes, { httpMetadata: { contentType, contentDisposition: `attachment; filename="hskkit-${job.kind}.${extension}"` }, customMetadata: { ownerUserId: job.user_id, jobId: job.id, checksumSha256, generationVersion: job.generation_version } });
    const defaultExpiry = Date.now() + (job.kind === "account_data" ? 24 * 60 * 60_000 : 14 * 24 * 60 * 60_000);
    const expiresAt = new Date(Math.min(defaultExpiry, entitlement ? Date.parse(entitlement.expires_at) : defaultExpiry)).toISOString();
    const committed=await markJobReady(job.id, leaseOwner, { objectKey, manifestJson: JSON.stringify(manifest), checksumSha256, byteSize: bytes.byteLength, expiresAt }, env);
    if(!committed) throw new Error("EXPORT_LEASE_LOST");
    objectKey=null;
    return { skipped: false as const, objectKey: `private/exports/${job.user_id}/${job.id}/hskkit-${job.kind}.${extension}`, checksumSha256, byteSize: bytes.byteLength };
  } catch (error) {
    if(objectKey) await env.COMMERCIAL_EXPORTS_R2.delete(objectKey);
    const code = error instanceof Error ? error.message.slice(0, 80) : "EXPORT_GENERATION_FAILED";
    await markJobFailed(message.jobId, leaseOwner, code, env);
    throw error;
  }
}
