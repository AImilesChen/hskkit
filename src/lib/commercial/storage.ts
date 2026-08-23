import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PDF_PACK_ACCESS_DAYS, PDF_PACK_CURRENCY, PDF_PACK_DOWNLOAD_LIMIT, PDF_PACK_PRICE_CENTS, PDF_PACK_SKU, canIssueDownload, refundEligibility } from "./domain.ts";

export const commerceDb = (env?: Pick<CloudflareEnv, "LEARNING_DB">) => env?.LEARNING_DB ?? getCloudflareContext().env.LEARNING_DB;
const nowIso = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}_${crypto.randomUUID()}`;

export type OrderRow = { id: string; user_id: string; sku:string; selected_level:number; status: string; stripe_checkout_session_id: string | null; stripe_payment_intent_id: string | null; stripe_charge_id: string | null; created_at: string; paid_at: string | null; refunded_at: string | null };
export type EntitlementRow = { id: string; user_id: string; order_id: string; selected_level:number; status: string; starts_at: string; expires_at: string; download_limit: number; successful_downloads: number; version: number };
export type ExportRow = { id: string; user_id: string; entitlement_id: string | null; kind: "pdf_pack" | "offline_pack" | "account_data"; format: "pdf" | "zip" | "json"; level: number | null; state: string; object_key: string | null; manifest_json: string | null; checksum_sha256: string | null; byte_size: number | null; generation_version: string; expires_at: string | null; error_code: string | null; created_at: string; updated_at: string };

export async function createPendingOrder(userId: string, selectedLevel:number, idempotencyKey: string) {
  if(!Number.isInteger(selectedLevel)||selectedLevel<1||selectedLevel>7) throw new Error("INVALID_LEVEL");
  const db = commerceDb(); const at = nowIso(); const orderId = id("ord");
  await db.prepare(`INSERT OR IGNORE INTO commerce_orders (id,user_id,sku,amount_cents,currency,selected_level,status,stripe_mode,idempotency_key,created_at,updated_at) VALUES (?,?,?,?,?,?,'pending','test',?,?,?)`)
    .bind(orderId, userId, PDF_PACK_SKU, PDF_PACK_PRICE_CENTS, PDF_PACK_CURRENCY, selectedLevel, idempotencyKey, at, at).run();
  const order=await db.prepare(`SELECT * FROM commerce_orders WHERE user_id=? AND idempotency_key=?`).bind(userId, idempotencyKey).first<OrderRow>();
  if(order&&order.selected_level!==selectedLevel) throw new Error("IDEMPOTENCY_CONFLICT");
  return order;
}
export async function attachCheckoutSession(orderId: string, sessionId: string) {
  await commerceDb().prepare(`UPDATE commerce_orders SET stripe_checkout_session_id=?,updated_at=? WHERE id=? AND status='pending'`).bind(sessionId, nowIso(), orderId).run();
}
export async function markOrderFailed(orderId: string) {
  await commerceDb().prepare(`UPDATE commerce_orders SET status='failed',updated_at=? WHERE id=? AND status='pending'`).bind(nowIso(), orderId).run();
}
export async function recordPaymentEvent(input: { eventId: string; eventType: string; livemode: boolean; payloadSha256: string; outcome: string }) {
  if (input.livemode) throw new Error("LIVE_EVENT_REJECTED");
  const result = await commerceDb().prepare(`INSERT OR IGNORE INTO payment_events (event_id,event_type,livemode,payload_sha256,processed_at,outcome) VALUES (?,?,0,?,?,?)`)
    .bind(input.eventId, input.eventType, input.payloadSha256, nowIso(), input.outcome).run();
  return result.meta.changes === 1;
}
export async function grantPaidEntitlement(input: { sessionId: string; orderId?: string; expectedUserId?: string; expectedSku?: string; expectedSelectedLevel?: number; paymentIntentId?: string; chargeId?: string }) {
  const db = commerceDb();
  const order = await db.prepare(`SELECT * FROM commerce_orders WHERE stripe_checkout_session_id=? OR (id=? AND stripe_checkout_session_id IS NULL) ORDER BY CASE WHEN stripe_checkout_session_id=? THEN 0 ELSE 1 END LIMIT 1`)
    .bind(input.sessionId,input.orderId??"",input.sessionId).first<OrderRow>();
  if (!order) throw new Error("ORDER_NOT_FOUND");
  if (input.expectedUserId && order.user_id!==input.expectedUserId) throw new Error("ORDER_METADATA_MISMATCH");
  if (input.expectedSku && (input.expectedSku!==PDF_PACK_SKU||order.sku!==input.expectedSku)) throw new Error("ORDER_METADATA_MISMATCH");
  if (input.expectedSelectedLevel && order.selected_level!==input.expectedSelectedLevel) throw new Error("ORDER_METADATA_MISMATCH");
  if (order.status === "refunded") throw new Error("ORDER_ALREADY_REFUNDED");
  if (order.status === "paid") return getEntitlementForOrder(order.id);
  const at = nowIso(); const expires = new Date(Date.parse(at) + PDF_PACK_ACCESS_DAYS * 86_400_000).toISOString(); const entitlementId = id("ent");
  await db.batch([
    db.prepare(`UPDATE commerce_orders SET status='paid',stripe_checkout_session_id=COALESCE(stripe_checkout_session_id,?),stripe_payment_intent_id=COALESCE(?,stripe_payment_intent_id),stripe_charge_id=COALESCE(?,stripe_charge_id),paid_at=COALESCE(paid_at,?),updated_at=? WHERE id=? AND status IN ('pending','failed')`).bind(input.sessionId,input.paymentIntentId ?? null,input.chargeId ?? null,at,at,order.id),
    db.prepare(`INSERT OR IGNORE INTO commercial_entitlements (id,user_id,order_id,sku,selected_level,status,starts_at,expires_at,download_limit,successful_downloads,version,updated_at) VALUES (?,?,?,?,?,'active',?,?,?,0,1,?)`).bind(entitlementId, order.user_id, order.id, PDF_PACK_SKU, order.selected_level, at, expires, PDF_PACK_DOWNLOAD_LIMIT, at),
    db.prepare(`INSERT INTO commercial_audit_events (id,user_id,event_type,entity_type,entity_id,details_json,created_at) VALUES (?,?, 'entitlement.granted','order',?, ?,?)`).bind(id("aud"), order.user_id, order.id, JSON.stringify({ mode: "test", sku: PDF_PACK_SKU }), at),
  ]);
  return getEntitlementForOrder(order.id);
}
export async function revokeRefundedOrder(input: { paymentIntentId?: string; chargeId?: string }) {
  const db = commerceDb();
  const order = await db.prepare(`SELECT * FROM commerce_orders WHERE (? IS NOT NULL AND stripe_payment_intent_id=?) OR (? IS NOT NULL AND stripe_charge_id=?)`).bind(input.paymentIntentId ?? null, input.paymentIntentId ?? null, input.chargeId ?? null, input.chargeId ?? null).first<OrderRow>();
  if (!order) throw new Error("ORDER_NOT_FOUND");
  if (order.status === "refunded") return;
  const at = nowIso();
  await db.batch([
    db.prepare(`UPDATE commerce_orders SET status='refunded',refunded_at=?,updated_at=? WHERE id=?`).bind(at, at, order.id),
    db.prepare(`UPDATE commercial_entitlements SET status='refunded',revoked_reason='refund',version=version+1,updated_at=? WHERE order_id=? AND status='active'`).bind(at, order.id),
    db.prepare(`UPDATE commercial_export_jobs SET state='revoked',expires_at=?,updated_at=? WHERE entitlement_id IN (SELECT id FROM commercial_entitlements WHERE order_id=?) AND state IN ('queued','generating','ready')`).bind(at, at, order.id),
    db.prepare(`UPDATE commercial_refund_requests SET status='refunded',reviewed_at=? WHERE order_id=?`).bind(at, order.id),
    db.prepare(`INSERT INTO commercial_audit_events (id,user_id,event_type,entity_type,entity_id,details_json,created_at) VALUES (?,?, 'entitlement.revoked','order',?, ?,?)`).bind(id("aud"), order.user_id, order.id, JSON.stringify({ reason: "refund" }), at),
  ]);
}
export async function getEntitlementForOrder(orderId: string) { return commerceDb().prepare(`SELECT * FROM commercial_entitlements WHERE order_id=?`).bind(orderId).first<EntitlementRow>(); }
export async function activeEntitlement(userId: string, at = nowIso()) { return commerceDb().prepare(`SELECT * FROM commercial_entitlements WHERE user_id=? AND status='active' AND expires_at>? ORDER BY starts_at DESC LIMIT 1`).bind(userId, at).first<EntitlementRow>(); }
export async function activeEntitlementForLevel(userId:string,selectedLevel:number,at=nowIso()){return commerceDb().prepare(`SELECT * FROM commercial_entitlements WHERE user_id=? AND selected_level=? AND status='active' AND expires_at>? ORDER BY starts_at DESC LIMIT 1`).bind(userId,selectedLevel,at).first<EntitlementRow>();}

export async function createExportJob(input: { userId: string; entitlementId?: string; kind: ExportRow["kind"]; format: ExportRow["format"]; level?: number; idempotencyKey: string; generationVersion: string }) {
  const db = commerceDb(); const jobId = id("exp"); const at = nowIso();
  await db.prepare(`INSERT OR IGNORE INTO commercial_export_jobs (id,user_id,entitlement_id,kind,format,level,state,idempotency_key,generation_version,created_at,updated_at) VALUES (?,?,?,?,?,?,'queued',?,?,?,?)`)
    .bind(jobId,input.userId,input.entitlementId ?? null,input.kind,input.format,input.level ?? null,input.idempotencyKey,input.generationVersion,at,at).run();
  return db.prepare(`SELECT * FROM commercial_export_jobs WHERE user_id=? AND idempotency_key=?`).bind(input.userId,input.idempotencyKey).first<ExportRow>();
}
export async function listExportJobs(userId: string) { return (await commerceDb().prepare(`SELECT * FROM commercial_export_jobs WHERE user_id=? ORDER BY created_at DESC LIMIT 50`).bind(userId).all<ExportRow>()).results; }
export async function listEntitlements(userId:string){return (await commerceDb().prepare(`SELECT id,order_id,sku,selected_level,status,starts_at,expires_at,download_limit,successful_downloads FROM commercial_entitlements WHERE user_id=? ORDER BY starts_at DESC`).bind(userId).all()).results;}
export async function getExportJob(jobId: string, userId?: string, env?: Pick<CloudflareEnv,"LEARNING_DB">) {
  const db = commerceDb(env); return userId ? db.prepare(`SELECT * FROM commercial_export_jobs WHERE id=? AND user_id=?`).bind(jobId,userId).first<ExportRow>() : db.prepare(`SELECT * FROM commercial_export_jobs WHERE id=?`).bind(jobId).first<ExportRow>();
}
export async function acquireJobLease(jobId: string, leaseOwner: string, env: Pick<CloudflareEnv,"LEARNING_DB">) {
  const at=nowIso(); const leaseExpiresAt=new Date(Date.parse(at)+5*60_000).toISOString();
  const result=await commerceDb(env).prepare(`UPDATE commercial_export_jobs SET state='generating',started_at=COALESCE(started_at,?),attempt=attempt+1,lease_owner=?,lease_expires_at=?,updated_at=? WHERE id=? AND (state='queued' OR (state='generating' AND lease_expires_at<?))`).bind(at,leaseOwner,leaseExpiresAt,at,jobId,at).run(); return result.meta.changes===1;
}
export async function markJobReady(jobId: string, leaseOwner:string, output: { objectKey:string; manifestJson:string; checksumSha256:string; byteSize:number; expiresAt:string }, env: Pick<CloudflareEnv,"LEARNING_DB">) {
  const at=nowIso(); const result=await commerceDb(env).prepare(`UPDATE commercial_export_jobs SET state='ready',object_key=?,manifest_json=?,checksum_sha256=?,byte_size=?,expires_at=?,completed_at=?,lease_owner=NULL,lease_expires_at=NULL,updated_at=? WHERE id=? AND state='generating' AND lease_owner=?`).bind(output.objectKey,output.manifestJson,output.checksumSha256,output.byteSize,output.expiresAt,at,at,jobId,leaseOwner).run();
  return result.meta.changes===1;
}
export async function markJobFailed(jobId:string,leaseOwner:string,errorCode:string,env:Pick<CloudflareEnv,"LEARNING_DB">) { await commerceDb(env).prepare(`UPDATE commercial_export_jobs SET state='failed',lease_owner=NULL,lease_expires_at=NULL,error_code=?,updated_at=? WHERE id=? AND state='generating' AND lease_owner=?`).bind(errorCode,nowIso(),jobId,leaseOwner).run(); }
export async function cancelExportJob(jobId:string,userId:string) { const result=await commerceDb().prepare(`UPDATE commercial_export_jobs SET state='cancelled',lease_owner=NULL,lease_expires_at=NULL,updated_at=? WHERE id=? AND user_id=? AND state IN ('queued','generating')`).bind(nowIso(),jobId,userId).run(); return result.meta.changes===1; }
export async function retryExportJob(jobId:string,userId:string) { const result=await commerceDb().prepare(`UPDATE commercial_export_jobs SET state='queued',error_code=NULL,lease_owner=NULL,lease_expires_at=NULL,updated_at=? WHERE id=? AND user_id=? AND state='failed' AND attempt<3`).bind(nowIso(),jobId,userId).run(); return result.meta.changes===1; }
export async function paymentEventExists(eventId:string) { return Boolean(await commerceDb().prepare(`SELECT 1 present FROM payment_events WHERE event_id=?`).bind(eventId).first()); }
export async function getOrderForUser(orderId:string,userId:string) { return commerceDb().prepare(`SELECT * FROM commerce_orders WHERE id=? AND user_id=?`).bind(orderId,userId).first<OrderRow>(); }
export async function revokeExportJob(jobId:string,reason:string){const db=commerceDb();const at=nowIso();await db.batch([db.prepare(`UPDATE commercial_export_jobs SET state='revoked',error_code=?,updated_at=? WHERE id=? AND state NOT IN ('revoked','expired')`).bind(reason,at,jobId),db.prepare(`DELETE FROM commercial_download_tokens WHERE job_id=?`).bind(jobId)]);}

export async function createDownloadTokenRecord(input:{ tokenId:string; jobId:string; userId:string; tokenSha256:string; expiresAt:string }) { await commerceDb().prepare(`INSERT INTO commercial_download_tokens (id,job_id,user_id,token_sha256,expires_at,created_at) VALUES (?,?,?,?,?,?)`).bind(input.tokenId,input.jobId,input.userId,input.tokenSha256,input.expiresAt,nowIso()).run(); }
export async function downloadContext(tokenSha256:string) { return commerceDb().prepare(`SELECT t.id token_id,t.user_id token_user_id,t.expires_at token_expires_at,t.consumed_at,j.*,e.status entitlement_status,e.download_limit,e.successful_downloads FROM commercial_download_tokens t JOIN commercial_export_jobs j ON j.id=t.job_id LEFT JOIN commercial_entitlements e ON e.id=j.entitlement_id WHERE t.token_sha256=?`).bind(tokenSha256).first<Record<string,unknown>>(); }
export async function consumeSuccessfulDownload(input:{ tokenId:string; jobId:string; entitlementId:string|null; userId:string; byteSize:number; checksumSha256:string }) {
  const db=commerceDb(); const at=nowIso();
  // Claim the single-use token first. Only one concurrent request can proceed.
  const claim=await db.prepare(`UPDATE commercial_download_tokens SET consumed_at=? WHERE id=? AND user_id=? AND consumed_at IS NULL AND expires_at>?`).bind(at,input.tokenId,input.userId,at).run();
  if(claim.meta.changes!==1) throw new Error("DOWNLOAD_TOKEN_CONSUMED");

  if (!input.entitlementId) {
    await db.prepare(`INSERT INTO commercial_download_ledger (id,token_id,job_id,entitlement_id,user_id,byte_size,checksum_sha256,succeeded_at) VALUES (?,?,?,?,?,?,?,?)`)
      .bind(id("dl"),input.tokenId,input.jobId,null,input.userId,input.byteSize,input.checksumSha256,at).run();
    return;
  }

  // D1 batch is transactional. The ledger insert reserves one entitlement slot;
  // the counter increments only when that token's ledger row was inserted.
  const [ledger]=await db.batch([
    db.prepare(`INSERT INTO commercial_download_ledger (id,token_id,job_id,entitlement_id,user_id,byte_size,checksum_sha256,succeeded_at)
      SELECT ?,?,?,?,?,?,?,? FROM commercial_entitlements
      WHERE id=? AND user_id=? AND status='active' AND successful_downloads<download_limit`)
      .bind(id("dl"),input.tokenId,input.jobId,input.entitlementId,input.userId,input.byteSize,input.checksumSha256,at,input.entitlementId,input.userId),
    db.prepare(`UPDATE commercial_entitlements SET successful_downloads=successful_downloads+1,version=version+1,updated_at=?
      WHERE id=? AND user_id=? AND successful_downloads<download_limit
        AND EXISTS (SELECT 1 FROM commercial_download_ledger WHERE token_id=?)`)
      .bind(at,input.entitlementId,input.userId,input.tokenId),
  ]);
  if(ledger.meta.changes!==1) throw new Error("DOWNLOAD_NOT_ALLOWED");
}
export async function requestRefund(userId:string,orderId:string) {
  const db=commerceDb(); const order=await db.prepare(`SELECT * FROM commerce_orders WHERE id=? AND user_id=?`).bind(orderId,userId).first<OrderRow>(); if(!order||!order.paid_at) throw new Error("ORDER_NOT_ELIGIBLE");
  const entitlement=await getEntitlementForOrder(order.id); if(!entitlement) throw new Error("ENTITLEMENT_NOT_FOUND");
  const eligibility=refundEligibility({ purchasedAt:order.paid_at,successfulDownloads:entitlement.successful_downloads,alreadyRefunded:order.status==="refunded" }); if(!eligibility.eligible) throw new Error(eligibility.code);
  const requestId=id("ref"); const at=nowIso(); await db.batch([
    db.prepare(`INSERT OR IGNORE INTO commercial_refund_requests (id,order_id,user_id,status,eligibility_code,requested_at) VALUES (?,?,?,'pending_review',?,?)`).bind(requestId,orderId,userId,eligibility.code,at),
    db.prepare(`UPDATE commerce_orders SET status='refund_requested',updated_at=? WHERE id=? AND status='paid'`).bind(at,orderId),
  ]); return db.prepare(`SELECT * FROM commercial_refund_requests WHERE order_id=?`).bind(orderId).first();
}
