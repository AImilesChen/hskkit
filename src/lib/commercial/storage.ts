import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PDF_PACK_ACCESS_DAYS, PDF_PACK_CURRENCY, PDF_PACK_DOWNLOAD_LIMIT, PDF_PACK_PRICE_CENTS, PDF_PACK_SKU, canIssueDownload, refundEligibility } from "./domain.ts";
import { SUBSCRIPTION_PLANS, entitlementFromSubscription, refundEligibility as subscriptionRefundEligibility, subscriptionPlan, type NormalizedSubscriptionEvent, type ProviderSubscriptionStatus, type SubscriptionPlanId } from "./subscription.ts";
import { resolveCommercialAccess } from "./referral-storage.ts";
import { welcomeCreditRollover } from "./referrals.ts";

export const commerceDb = (env?: Pick<CloudflareEnv, "LEARNING_DB">) => env?.LEARNING_DB ?? getCloudflareContext().env.LEARNING_DB;
const nowIso = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}_${crypto.randomUUID()}`;
export const packPurchaseGrantInsertSql = `INSERT OR IGNORE INTO pack_purchases (id,user_id,order_id,sku,selected_level,status,starts_at,expires_at,download_limit,successful_downloads,version,updated_at) SELECT ?,user_id,id,sku,selected_level,'active',?,?,?,0,1,? FROM commerce_orders WHERE id=? AND status='paid' AND sku=?`;

export type OrderRow = { id: string; user_id: string; sku:string; selected_level:number; status: string; stripe_checkout_session_id: string | null; stripe_payment_intent_id: string | null; stripe_charge_id: string | null; created_at: string; paid_at: string | null; refunded_at: string | null };
export type PackPurchaseRow = { id: string; user_id: string; order_id: string; selected_level:number; status: string; starts_at: string; expires_at: string; download_limit: number; successful_downloads: number; version: number };
export type ExportRow = { id: string; user_id: string; pack_purchase_id: string | null; product_entitlement_id:string|null; product_id:string|null; delivery_key:string|null; kind: "pdf_pack" | "offline_pack" | "account_data"; format: "pdf" | "zip" | "json"; level: number | null; state: string; object_key: string | null; manifest_json: string | null; checksum_sha256: string | null; byte_size: number | null; generation_version: string; expires_at: string | null; error_code: string | null; created_at: string; updated_at: string };

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
export async function grantPaidPackPurchase(input: { sessionId: string; orderId?: string; expectedUserId?: string; expectedSku?: string; expectedSelectedLevel?: number; paymentIntentId?: string; chargeId?: string }, env?: Pick<CloudflareEnv,"LEARNING_DB">) {
  const db = commerceDb(env);
  const order = await db.prepare(`SELECT * FROM commerce_orders WHERE stripe_checkout_session_id=? OR (id=? AND stripe_checkout_session_id IS NULL) ORDER BY CASE WHEN stripe_checkout_session_id=? THEN 0 ELSE 1 END LIMIT 1`)
    .bind(input.sessionId,input.orderId??"",input.sessionId).first<OrderRow>();
  if (!order) throw new Error("ORDER_NOT_FOUND");
  if (input.expectedUserId && order.user_id!==input.expectedUserId) throw new Error("ORDER_METADATA_MISMATCH");
  if (input.expectedSku && (input.expectedSku!==PDF_PACK_SKU||order.sku!==input.expectedSku)) throw new Error("ORDER_METADATA_MISMATCH");
  if (input.expectedSelectedLevel && order.selected_level!==input.expectedSelectedLevel) throw new Error("ORDER_METADATA_MISMATCH");
  if (order.status === "refunded") throw new Error("ORDER_ALREADY_REFUNDED");
  if (order.status === "paid") {
    const existing = await getPackPurchaseForOrder(order.id,env);
    if (existing) return existing;
  }
  const at = nowIso(); const expires = new Date(Date.parse(at) + PDF_PACK_ACCESS_DAYS * 86_400_000).toISOString(); const packPurchaseId = id("pack");
  await db.batch([
    db.prepare(`UPDATE commerce_orders SET status='paid',stripe_checkout_session_id=COALESCE(stripe_checkout_session_id,?),stripe_payment_intent_id=COALESCE(?,stripe_payment_intent_id),stripe_charge_id=COALESCE(?,stripe_charge_id),paid_at=COALESCE(paid_at,?),updated_at=? WHERE id=? AND status IN ('pending','failed','paid')`).bind(input.sessionId,input.paymentIntentId ?? null,input.chargeId ?? null,at,at,order.id),
    db.prepare(packPurchaseGrantInsertSql).bind(packPurchaseId, at, expires, PDF_PACK_DOWNLOAD_LIMIT, at, order.id, PDF_PACK_SKU),
    db.prepare(`INSERT INTO commercial_audit_events (id,user_id,event_type,entity_type,entity_id,details_json,created_at) SELECT ?,user_id,'pack_purchase.granted','order',order_id,?,? FROM pack_purchases WHERE id=? AND order_id=?`).bind(id("aud"), JSON.stringify({ mode: "test", sku: PDF_PACK_SKU }), at, packPurchaseId, order.id),
  ]);
  const purchase = await getPackPurchaseForOrder(order.id,env);
  if (purchase) return purchase;
  const latest = await db.prepare(`SELECT status FROM commerce_orders WHERE id=?`).bind(order.id).first<{status:string}>();
  if (latest?.status === "refunded") throw new Error("ORDER_ALREADY_REFUNDED");
  throw new Error("PACK_PURCHASE_GRANT_FAILED");
}
export async function revokeRefundedOrder(input: { paymentIntentId?: string; chargeId?: string; amountRefundedCents?:number; currency?:string }, env?: Pick<CloudflareEnv,"LEARNING_DB">) {
  const db = commerceDb(env);
  const order = await db.prepare(`SELECT * FROM commerce_orders WHERE (? IS NOT NULL AND stripe_payment_intent_id=?) OR (? IS NOT NULL AND stripe_charge_id=?)`).bind(input.paymentIntentId ?? null, input.paymentIntentId ?? null, input.chargeId ?? null, input.chargeId ?? null).first<OrderRow>();
  if (!order) throw new Error("ORDER_NOT_FOUND");
  if(input.currency&&input.currency!==order.currency)throw new Error("REFUND_CURRENCY_MISMATCH");
  if(input.amountRefundedCents!==undefined&&input.amountRefundedCents<order.amount_cents)throw new Error("PARTIAL_REFUND_NOT_FINAL");
  const objects=(await db.prepare(`SELECT object_key FROM commercial_export_jobs WHERE pack_purchase_id IN (SELECT id FROM pack_purchases WHERE order_id=?) AND object_key IS NOT NULL`).bind(order.id).all<{object_key:string}>()).results.map((row:{object_key:string})=>row.object_key);
  if (order.status === "refunded") return objects;
  const at = nowIso();
  await db.batch([
    db.prepare(`UPDATE commerce_orders SET status='refunded',refunded_at=?,updated_at=? WHERE id=?`).bind(at, at, order.id),
    db.prepare(`UPDATE pack_purchases SET status='refunded',revoked_reason='refund',version=version+1,updated_at=? WHERE order_id=? AND status='active'`).bind(at, order.id),
    db.prepare(`UPDATE commercial_export_jobs SET state='revoked',expires_at=?,error_code='REFUND_REVOKED',lease_owner=NULL,lease_expires_at=NULL,updated_at=? WHERE pack_purchase_id IN (SELECT id FROM pack_purchases WHERE order_id=?) AND state IN ('queued','generating','ready','failed')`).bind(at, at, order.id),
    db.prepare(`DELETE FROM commercial_download_tokens WHERE consumed_at IS NULL AND job_id IN (SELECT id FROM commercial_export_jobs WHERE pack_purchase_id IN (SELECT id FROM pack_purchases WHERE order_id=?))`).bind(order.id),
    db.prepare(`UPDATE commercial_refund_requests SET status='refunded',reviewed_at=? WHERE order_id=?`).bind(at, order.id),
    db.prepare(`INSERT INTO commercial_audit_events (id,user_id,event_type,entity_type,entity_id,details_json,created_at) VALUES (?,?, 'pack_purchase.revoked','order',?, ?,?)`).bind(id("aud"), order.user_id, order.id, JSON.stringify({ reason: "refund" }), at),
  ]);
  return objects;
}
export async function getPackPurchaseForOrder(orderId: string,env?:Pick<CloudflareEnv,"LEARNING_DB">) { return commerceDb(env).prepare(`SELECT * FROM pack_purchases WHERE order_id=?`).bind(orderId).first<PackPurchaseRow>(); }
export async function activePackPurchase(userId: string, at = nowIso()) { return commerceDb().prepare(`SELECT * FROM pack_purchases WHERE user_id=? AND status='active' AND expires_at>? ORDER BY starts_at DESC LIMIT 1`).bind(userId, at).first<PackPurchaseRow>(); }
export async function activePackPurchaseForLevel(userId:string,selectedLevel:number,at=nowIso()){return commerceDb().prepare(`SELECT * FROM pack_purchases WHERE user_id=? AND selected_level=? AND status='active' AND expires_at>? ORDER BY starts_at DESC LIMIT 1`).bind(userId,selectedLevel,at).first<PackPurchaseRow>();}

export async function createExportJob(input: { userId: string; packPurchaseId?: string; productEntitlementId?:string; productId?:string; deliveryKey?:string; kind: ExportRow["kind"]; format: ExportRow["format"]; level?: number; idempotencyKey: string; generationVersion: string },env?:Pick<CloudflareEnv,"LEARNING_DB">) {
  const db = commerceDb(env); const jobId = id("exp"); const at = nowIso(); const expiresAt=new Date(Date.parse(at)+(input.kind==="account_data"?1:14)*86_400_000).toISOString();
  await db.prepare(`INSERT OR IGNORE INTO commercial_export_jobs (id,user_id,pack_purchase_id,product_entitlement_id,product_id,delivery_key,kind,format,level,state,idempotency_key,generation_version,expires_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,'queued',?,?,?,?,?)`)
    .bind(jobId,input.userId,input.packPurchaseId ?? null,input.productEntitlementId??null,input.productId??null,input.deliveryKey??null,input.kind,input.format,input.level ?? null,input.idempotencyKey,input.generationVersion,expiresAt,at,at).run();
  const job=await db.prepare(`SELECT * FROM commercial_export_jobs WHERE user_id=? AND idempotency_key=?`).bind(input.userId,input.idempotencyKey).first<ExportRow>();
  if(job && (job.kind!==input.kind || job.format!==input.format || job.level!==(input.level??null) || job.pack_purchase_id!==(input.packPurchaseId??null)||job.product_entitlement_id!==(input.productEntitlementId??null))) throw new Error("IDEMPOTENCY_CONFLICT");
  return job;
}
export async function listExportJobs(userId: string) { return (await commerceDb().prepare(`SELECT * FROM commercial_export_jobs WHERE user_id=? ORDER BY created_at DESC LIMIT 50`).bind(userId).all<ExportRow>()).results; }
export async function listPackPurchases(userId:string){return (await commerceDb().prepare(`SELECT id,order_id,sku,selected_level,status,starts_at,expires_at,download_limit,successful_downloads FROM pack_purchases WHERE user_id=? ORDER BY starts_at DESC LIMIT 50`).bind(userId).all<PackPurchaseRow>()).results;}

export async function revokePackPurchase(input:{packPurchaseId:string;reason:string}){
  const db=commerceDb();const at=nowIso();
  const purchase=await db.prepare(`SELECT id,status FROM pack_purchases WHERE id=?`).bind(input.packPurchaseId).first<{id:string;status:string}>();
  if(!purchase) throw new Error("PACK_PURCHASE_NOT_FOUND");
  const objects=(await db.prepare(`SELECT object_key FROM commercial_export_jobs WHERE pack_purchase_id=? AND object_key IS NOT NULL`).bind(input.packPurchaseId).all<{object_key:string}>()).results.map((row:{object_key:string})=>row.object_key);
  if(purchase.status==="revoked") return objects;
  if(purchase.status!=="active") throw new Error("PACK_PURCHASE_NOT_ACTIVE");
  await db.batch([
    db.prepare(`UPDATE pack_purchases SET status='revoked',revoked_reason=?,version=version+1,updated_at=? WHERE id=? AND status='active'`).bind(input.reason,at,input.packPurchaseId),
    db.prepare(`UPDATE commercial_export_jobs SET state='revoked',error_code='PACK_PURCHASE_REVOKED',lease_owner=NULL,lease_expires_at=NULL,updated_at=? WHERE pack_purchase_id=? AND state!='revoked'`).bind(at,input.packPurchaseId),
    db.prepare(`DELETE FROM commercial_download_tokens WHERE consumed_at IS NULL AND job_id IN (SELECT id FROM commercial_export_jobs WHERE pack_purchase_id=?)`).bind(input.packPurchaseId),
    db.prepare(`INSERT INTO commercial_audit_events (id,user_id,event_type,entity_type,entity_id,details_json,created_at) SELECT ?,user_id,'pack_purchase_revoked','pack_purchase',?,json_object('reason',?),? FROM pack_purchases WHERE id=?`).bind(id("audit"),input.packPurchaseId,input.reason,at,input.packPurchaseId),
  ]);
  return objects;
}

export async function expireReadyExports(limit=100,env?:Pick<CloudflareEnv,"LEARNING_DB">){
  const db=commerceDb(env);const at=nowIso();
  await db.prepare(`UPDATE pack_purchases SET status='expired',version=version+1,updated_at=? WHERE status='active' AND expires_at<=?`).bind(at,at).run();
  await db.prepare(`UPDATE digital_product_entitlements SET status='expired',version=version+1,updated_at=? WHERE status='active' AND expires_at<=?`).bind(at,at).run();
  const rows=(await db.prepare(`SELECT id,object_key FROM commercial_export_jobs WHERE state IN ('queued','generating','ready','failed') AND expires_at<=? ORDER BY expires_at ASC LIMIT ?`).bind(at,limit).all<{id:string;object_key:string|null}>()).results;
  for(const row of rows){
    const result=await db.prepare(`UPDATE commercial_export_jobs SET state='expired',lease_owner=NULL,lease_expires_at=NULL,updated_at=? WHERE id=? AND state IN ('queued','generating','ready','failed') AND expires_at<=?`).bind(at,row.id,at).run();
    if(result.meta.changes===1) await db.prepare(`DELETE FROM commercial_download_tokens WHERE job_id=? AND consumed_at IS NULL`).bind(row.id).run();
  }
  return (await db.prepare(`SELECT id,object_key objectKey FROM commercial_export_jobs WHERE state IN ('expired','revoked') AND object_key IS NOT NULL ORDER BY updated_at ASC LIMIT ?`).bind(limit).all<{id:string;objectKey:string}>()).results;
}
export async function listPackOrders(userId:string){return (await commerceDb().prepare(`SELECT o.id,o.sku,o.selected_level,o.amount_cents,o.currency,o.status,o.created_at,o.paid_at,o.refunded_at,p.status purchase_status,p.starts_at,p.expires_at,p.download_limit,p.successful_downloads FROM commerce_orders o LEFT JOIN pack_purchases p ON p.order_id=o.id WHERE o.user_id=? ORDER BY o.created_at DESC LIMIT 50`).bind(userId).all()).results;}
export async function packCheckoutResultForUser(sessionId:string,userId:string){return commerceDb().prepare(`SELECT o.id order_id,o.status order_status,o.selected_level,o.amount_cents,o.currency,p.id pack_purchase_id,p.status purchase_status,p.expires_at,p.download_limit,p.successful_downloads FROM commerce_orders o LEFT JOIN pack_purchases p ON p.order_id=o.id WHERE o.stripe_checkout_session_id=? AND o.user_id=?`).bind(sessionId,userId).first<Record<string,unknown>>();}
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
export async function revokeExportJob(jobId:string,reason:string){
  const db=commerceDb();const at=nowIso();
  const job=await db.prepare(`SELECT object_key FROM commercial_export_jobs WHERE id=?`).bind(jobId).first<{object_key:string|null}>();
  await db.batch([
    db.prepare(`UPDATE commercial_export_jobs SET state='revoked',error_code=?,expires_at=?,lease_owner=NULL,lease_expires_at=NULL,updated_at=? WHERE id=? AND state NOT IN ('revoked','expired')`).bind(reason,at,at,jobId),
    db.prepare(`DELETE FROM commercial_download_tokens WHERE job_id=? AND consumed_at IS NULL`).bind(jobId),
  ]);
  return job?.object_key??null;
}
export async function expireExportJob(jobId:string){
  const db=commerceDb();const at=nowIso();
  const job=await db.prepare(`SELECT object_key FROM commercial_export_jobs WHERE id=?`).bind(jobId).first<{object_key:string|null}>();
  await db.batch([
    db.prepare(`UPDATE commercial_export_jobs SET state='expired',error_code='ACCESS_EXPIRED',lease_owner=NULL,lease_expires_at=NULL,updated_at=? WHERE id=? AND state='ready' AND expires_at<=?`).bind(at,jobId,at),
    db.prepare(`DELETE FROM commercial_download_tokens WHERE job_id=? AND consumed_at IS NULL`).bind(jobId),
  ]);
  return job?.object_key??null;
}
export async function clearExportObjectKey(jobId:string,objectKey:string,env?:Pick<CloudflareEnv,"LEARNING_DB">){await commerceDb(env).prepare(`UPDATE commercial_export_jobs SET object_key=NULL,updated_at=? WHERE id=? AND object_key=? AND state IN ('expired','revoked')`).bind(nowIso(),jobId,objectKey).run();}
export async function clearRevokedExportObjectKey(objectKey:string){await commerceDb().prepare(`UPDATE commercial_export_jobs SET object_key=NULL,updated_at=? WHERE object_key=? AND state='revoked'`).bind(nowIso(),objectKey).run();}

export async function createDownloadTokenRecord(input:{ tokenId:string; jobId:string; userId:string; tokenSha256:string; expiresAt:string },env?:Pick<CloudflareEnv,"LEARNING_DB">) { await commerceDb(env).prepare(`INSERT INTO commercial_download_tokens (id,job_id,user_id,token_sha256,expires_at,created_at) VALUES (?,?,?,?,?,?)`).bind(input.tokenId,input.jobId,input.userId,input.tokenSha256,input.expiresAt,nowIso()).run(); }
export async function downloadContext(tokenSha256:string,env?:Pick<CloudflareEnv,"LEARNING_DB">) { return commerceDb(env).prepare(`SELECT t.id token_id,t.user_id token_user_id,t.expires_at token_expires_at,t.consumed_at,j.*,p.status pack_purchase_status,p.expires_at pack_purchase_expires_at,p.download_limit,p.successful_downloads,e.status product_entitlement_status,e.stripe_livemode product_entitlement_livemode,e.expires_at product_entitlement_expires_at,e.download_limit product_download_limit,e.successful_downloads product_successful_downloads FROM commercial_download_tokens t JOIN commercial_export_jobs j ON j.id=t.job_id LEFT JOIN pack_purchases p ON p.id=j.pack_purchase_id LEFT JOIN digital_product_entitlements e ON e.id=j.product_entitlement_id WHERE t.token_sha256=?`).bind(tokenSha256).first<Record<string,unknown>>(); }
export async function consumeSuccessfulDownload(input:{ tokenId:string; jobId:string; packPurchaseId:string|null; productEntitlementId?:string|null; userId:string; byteSize:number; checksumSha256:string },env?:Pick<CloudflareEnv,"LEARNING_DB">) {
  const db=commerceDb(env); const at=nowIso();
  if(input.productEntitlementId){
    const [claim,ledger,debit]=await db.batch([
      db.prepare(`UPDATE commercial_download_tokens SET consumed_at=? WHERE id=? AND user_id=? AND consumed_at IS NULL AND expires_at>?`).bind(at,input.tokenId,input.userId,at),
      db.prepare(`INSERT INTO commercial_download_ledger(id,token_id,job_id,pack_purchase_id,product_entitlement_id,user_id,byte_size,checksum_sha256,succeeded_at) SELECT ?,?,?,?,?,?,?,?,? FROM digital_product_entitlements WHERE id=? AND user_id=? AND status='active' AND expires_at>? AND successful_downloads<download_limit AND EXISTS(SELECT 1 FROM commercial_download_tokens WHERE id=? AND consumed_at=?)`).bind(id("dl"),input.tokenId,input.jobId,null,input.productEntitlementId,input.userId,input.byteSize,input.checksumSha256,at,input.productEntitlementId,input.userId,at,input.tokenId,at),
      db.prepare(`UPDATE digital_product_entitlements SET successful_downloads=successful_downloads+1,version=version+1,updated_at=? WHERE id=? AND user_id=? AND successful_downloads<download_limit AND EXISTS(SELECT 1 FROM commercial_download_ledger WHERE token_id=? AND succeeded_at=?)`).bind(at,input.productEntitlementId,input.userId,input.tokenId,at),
    ]);
    if(claim.meta.changes!==1||ledger.meta.changes!==1||debit.meta.changes!==1)throw new Error("DOWNLOAD_NOT_ALLOWED");return;
  }
  if (!input.packPurchaseId) {
    const [claim,ledger]=await db.batch([
      db.prepare(`UPDATE commercial_download_tokens SET consumed_at=? WHERE id=? AND user_id=? AND consumed_at IS NULL AND expires_at>?`).bind(at,input.tokenId,input.userId,at),
      db.prepare(`INSERT INTO commercial_download_ledger (id,token_id,job_id,pack_purchase_id,user_id,byte_size,checksum_sha256,succeeded_at) SELECT ?,?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM commercial_download_tokens WHERE id=? AND consumed_at=?)`).bind(id("dl"),input.tokenId,input.jobId,null,input.userId,input.byteSize,input.checksumSha256,at,input.tokenId,at),
    ]);
    if(claim.meta.changes!==1||ledger.meta.changes!==1) throw new Error("DOWNLOAD_NOT_ALLOWED");
    return;
  }
  // D1 batch is transactional: token claim, immutable ledger and PackPurchase debit commit together.
  const [claim,ledger,debit]=await db.batch([
    db.prepare(`UPDATE commercial_download_tokens SET consumed_at=? WHERE id=? AND user_id=? AND consumed_at IS NULL AND expires_at>?`).bind(at,input.tokenId,input.userId,at),
    db.prepare(`INSERT INTO commercial_download_ledger (id,token_id,job_id,pack_purchase_id,user_id,byte_size,checksum_sha256,succeeded_at)
      SELECT ?,?,?,?,?,?,?,? FROM pack_purchases
      WHERE id=? AND user_id=? AND status='active' AND expires_at>? AND successful_downloads<download_limit
        AND EXISTS (SELECT 1 FROM commercial_download_tokens WHERE id=? AND consumed_at=?)`)
      .bind(id("dl"),input.tokenId,input.jobId,input.packPurchaseId,input.userId,input.byteSize,input.checksumSha256,at,input.packPurchaseId,input.userId,at,input.tokenId,at),
    db.prepare(`UPDATE pack_purchases SET successful_downloads=successful_downloads+1,version=version+1,updated_at=?
      WHERE id=? AND user_id=? AND successful_downloads<download_limit
        AND EXISTS (SELECT 1 FROM commercial_download_ledger WHERE token_id=? AND succeeded_at=?)`)
      .bind(at,input.packPurchaseId,input.userId,input.tokenId,at),
  ]);
  if(claim.meta.changes!==1||ledger.meta.changes!==1||debit.meta.changes!==1) throw new Error("DOWNLOAD_NOT_ALLOWED");
}
export async function requestRefund(userId:string,orderId:string) {
  const db=commerceDb(); const order=await db.prepare(`SELECT * FROM commerce_orders WHERE id=? AND user_id=?`).bind(orderId,userId).first<OrderRow>(); if(!order||!order.paid_at) throw new Error("ORDER_NOT_ELIGIBLE");
  const purchase=await getPackPurchaseForOrder(order.id); if(!purchase) throw new Error("PACK_PURCHASE_NOT_FOUND");
  const eligibility=refundEligibility({ purchasedAt:order.paid_at,successfulDownloads:purchase.successful_downloads,alreadyRefunded:order.status==="refunded" }); if(!eligibility.eligible) throw new Error(eligibility.code);
  const requestId=id("ref"); const at=nowIso(); await db.batch([
    db.prepare(`INSERT OR IGNORE INTO commercial_refund_requests (id,order_id,user_id,status,eligibility_code,requested_at) VALUES (?,?,?,'pending_review',?,?)`).bind(requestId,orderId,userId,eligibility.code,at),
    db.prepare(`UPDATE commerce_orders SET status='refund_requested',updated_at=? WHERE id=? AND status='paid'`).bind(at,orderId),
  ]); return db.prepare(`SELECT * FROM commercial_refund_requests WHERE order_id=?`).bind(orderId).first();
}

export type SubscriptionOrderRow = { id:string; owner_id:string; user_id:string; plan_id:SubscriptionPlanId; amount_cents:number; currency:string; status:string; stripe_livemode:number; idempotency_key:string; provider_checkout_session_id:string|null; provider_checkout_url:string|null; provider_customer_id:string|null; provider_subscription_id:string|null; created_at:string; updated_at:string };
export type SubscriptionRow = { id:string; owner_id:string; user_id:string; plan_id:SubscriptionPlanId; status:ProviderSubscriptionStatus; cancel_at_period_end:number; current_period_start:string|null; current_period_end:string|null; provider_customer_id:string; provider_subscription_id:string; source_order_id:string|null; stripe_livemode?:number; created_at:string; updated_at:string };
export type SubscriptionChargeRow = { id:string; subscription_id:string; owner_id:string; provider_invoice_id:string; provider_payment_intent_id:string|null; provider_charge_id:string|null; amount_cents:number; amount_refunded_cents:number; currency:string; status:string; stripe_livemode:number; charged_at:string|null; created_at:string; updated_at:string };

export async function createSubscriptionOrder(input:{ownerId:string;userId:string;planId:SubscriptionPlanId;idempotencyKey:string;livemode?:boolean}) {
  const db=commerceDb(); const at=nowIso(); const plan=SUBSCRIPTION_PLANS[input.planId]; const orderId=id("subord");const storageIdempotencyKey=`${input.livemode?"live":"test"}:${input.idempotencyKey}`;
  await db.prepare(`INSERT OR IGNORE INTO subscription_orders (id,owner_id,user_id,plan_id,amount_cents,currency,status,stripe_livemode,idempotency_key,created_at,updated_at) VALUES (?,?,?,?,?,?,'pending',?,?,?,?)`)
    .bind(orderId,input.ownerId,input.userId,input.planId,plan.amountCents,plan.currency,input.livemode?1:0,storageIdempotencyKey,at,at).run();
  const order=await db.prepare(`SELECT * FROM subscription_orders WHERE owner_id=? AND idempotency_key=?`).bind(input.ownerId,storageIdempotencyKey).first<SubscriptionOrderRow>();
  if(!order) throw new Error("SUBSCRIPTION_ORDER_NOT_CREATED");
  if(order.plan_id!==input.planId||Boolean(order.stripe_livemode)!==Boolean(input.livemode)) throw new Error("IDEMPOTENCY_CONFLICT");
  return order;
}
export async function openSubscriptionCheckout(ownerId:string,planId:SubscriptionPlanId,livemode=false){return commerceDb().prepare(`SELECT * FROM subscription_orders WHERE owner_id=? AND plan_id=? AND stripe_livemode=? AND status='checkout_created' AND provider_checkout_url IS NOT NULL AND updated_at>? ORDER BY updated_at DESC LIMIT 1`).bind(ownerId,planId,livemode?1:0,new Date(Date.now()-24*60*60*1000).toISOString()).first<SubscriptionOrderRow>();}
export async function attachSubscriptionCheckout(orderId:string,checkoutSessionId:string,checkoutUrl:string){await commerceDb().prepare(`UPDATE subscription_orders SET status='checkout_created',provider_checkout_session_id=?,provider_checkout_url=?,updated_at=? WHERE id=? AND status IN ('pending','checkout_created','failed')`).bind(checkoutSessionId,checkoutUrl,nowIso(),orderId).run();}
export async function markSubscriptionOrderFailed(orderId:string){await commerceDb().prepare(`UPDATE subscription_orders SET status='failed',updated_at=? WHERE id=? AND status IN ('pending','checkout_created')`).bind(nowIso(),orderId).run();}

export async function claimPaymentEvent(input:{eventId:string;eventType:string;livemode:boolean;payloadSha256:string}, env?: Pick<CloudflareEnv, "LEARNING_DB">) {
  const at=nowIso(); const db=commerceDb(env); const claimToken=id("whclaim"); const table=input.livemode?"live_payment_events":"payment_events";
  const existing=await db.prepare(`SELECT outcome,processed_at FROM ${table} WHERE event_id=?`).bind(input.eventId).first<{outcome:string;processed_at:string}>();
  if(existing?.outcome==="processed"||existing?.outcome==="ignored") return {state:"duplicate" as const};
  const staleBefore=new Date(Date.now()-5*60*1000).toISOString();
  if(existing?.outcome==="processing"&&existing.processed_at>staleBefore) return {state:"busy" as const};
  if(existing){const retried=await db.prepare(`UPDATE ${table} SET event_type=?,payload_sha256=?,outcome='processing',processed_at=?,claim_token=? WHERE event_id=? AND (outcome='failed' OR (outcome='processing' AND processed_at<=?))`).bind(input.eventType,input.payloadSha256,at,claimToken,input.eventId,staleBefore).run();return retried.meta.changes===1?{state:"claimed" as const,claimToken}:{state:"busy" as const};}
  const result=await db.prepare(`INSERT OR IGNORE INTO ${table}(event_id,event_type,livemode,payload_sha256,processed_at,outcome,claim_token) VALUES(?,?,?,?,?,'processing',?)`).bind(input.eventId,input.eventType,input.livemode?1:0,input.payloadSha256,at,claimToken).run();
  if(result.meta.changes===1) return {state:"claimed" as const,claimToken};
  return {state:"busy" as const};
}
export async function finalizePaymentEvent(eventId:string,claimToken:string,outcome:"processed"|"ignored"|"failed",env?:Pick<CloudflareEnv,"LEARNING_DB">,livemode=false){const table=livemode?"live_payment_events":"payment_events";const result=await commerceDb(env).prepare(`UPDATE ${table} SET outcome=?,processed_at=?,claim_token=NULL WHERE event_id=? AND outcome='processing' AND claim_token=?`).bind(outcome,nowIso(),eventId,claimToken).run();if(result.meta.changes!==1) throw new Error("WEBHOOK_CLAIM_LOST");}

export async function applySubscriptionEvent(event:NormalizedSubscriptionEvent, env?: Pick<CloudflareEnv, "LEARNING_DB">,livemode=false){
  const db=commerceDb(env); const at=nowIso();
  if(event.kind==="checkout_completed"){
    const order=await db.prepare(`SELECT * FROM subscription_orders WHERE id=?`).bind(event.orderId).first<SubscriptionOrderRow>();
    const plan=SUBSCRIPTION_PLANS[event.planId];
    if(!order||Boolean(order.stripe_livemode)!==livemode||order.user_id!==event.userId||order.owner_id!==event.ownerId||order.owner_id!==`user:${event.userId}`||order.plan_id!==event.planId||order.amount_cents!==plan.amountCents||order.amount_cents!==event.amountCents||order.currency!==plan.currency||order.currency!==event.currency||(order.provider_checkout_session_id&&order.provider_checkout_session_id!==event.checkoutSessionId)||(order.provider_customer_id&&order.provider_customer_id!==event.customerId)||(order.provider_subscription_id&&order.provider_subscription_id!==event.subscriptionId)) throw new Error("SUBSCRIPTION_ORDER_METADATA_MISMATCH");
    if(order.status==="refunded") return;
    const updated=await db.prepare(`UPDATE subscription_orders SET status='completed',provider_checkout_session_id=?,provider_customer_id=?,provider_subscription_id=?,updated_at=? WHERE id=? AND user_id=? AND plan_id=? AND status<>'refunded'`).bind(event.checkoutSessionId,event.customerId,event.subscriptionId,at,event.orderId,event.userId,event.planId).run();
    if(updated.meta.changes!==1) throw new Error("SUBSCRIPTION_ORDER_UPDATE_FAILED"); return;
  }
  if(event.kind==="subscription_updated"){
    const order=await db.prepare(`SELECT * FROM subscription_orders WHERE (id=? AND ?<>'') OR provider_subscription_id=? ORDER BY CASE WHEN id=? THEN 0 ELSE 1 END LIMIT 1`).bind(event.orderId??"",event.orderId??"",event.subscriptionId,event.orderId??"").first<SubscriptionOrderRow>();
    const existingSubscription=await db.prepare(`SELECT * FROM subscriptions WHERE provider_subscription_id=?`).bind(event.subscriptionId).first<SubscriptionRow>();
    const plan=SUBSCRIPTION_PLANS[event.planId];
    const yearlyUpgrade=order?.plan_id==="pro_monthly"&&event.planId==="pro_yearly";
    const currentPlanMatches=order?.plan_id===event.planId||existingSubscription?.plan_id===event.planId||yearlyUpgrade;
    if(!order||Boolean(order.stripe_livemode)!==livemode||order.user_id!==event.userId||order.owner_id!==event.ownerId||order.owner_id!==`user:${event.userId}`||!currentPlanMatches||plan.amountCents!==event.amountCents||order.currency!==plan.currency||order.currency!==event.currency||(order.provider_customer_id&&order.provider_customer_id!==event.customerId)||(order.provider_subscription_id&&order.provider_subscription_id!==event.subscriptionId)) throw new Error("SUBSCRIPTION_ORDER_METADATA_MISMATCH");
    if(order.status==="refunded") return;
    const ownerId=order.owner_id; const subId=`sub_${event.subscriptionId}`; const entitlement=entitlementFromSubscription({status:event.status,currentPeriodEnd:event.currentPeriodEnd,cancelAtPeriodEnd:event.cancelAtPeriodEnd},new Date(at));
    await db.batch([
      db.prepare(`INSERT INTO subscriptions(id,owner_id,user_id,plan_id,status,cancel_at_period_end,current_period_start,current_period_end,provider_customer_id,provider_subscription_id,source_order_id,stripe_livemode,created_at,updated_at) SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM subscription_orders WHERE id=? AND status='refunded') ON CONFLICT(provider_subscription_id) DO UPDATE SET plan_id=excluded.plan_id,status=excluded.status,cancel_at_period_end=excluded.cancel_at_period_end,current_period_start=excluded.current_period_start,current_period_end=excluded.current_period_end,provider_customer_id=excluded.provider_customer_id,stripe_livemode=excluded.stripe_livemode,updated_at=excluded.updated_at WHERE NOT EXISTS (SELECT 1 FROM subscription_orders WHERE id=excluded.source_order_id AND status='refunded')`).bind(subId,ownerId,event.userId,event.planId,event.status,event.cancelAtPeriodEnd?1:0,event.currentPeriodStart??null,event.currentPeriodEnd??null,event.customerId,event.subscriptionId,order.id,livemode?1:0,at,at,order.id),
      db.prepare(`INSERT INTO subscription_entitlements(owner_id,subscription_id,plan_id,status,starts_at,ends_at,revoked_at,revocation_reason,stripe_livemode,updated_at) SELECT ?,?,?,?,?,?,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM subscription_orders WHERE id=? AND status='refunded') ON CONFLICT(owner_id,stripe_livemode) DO UPDATE SET subscription_id=CASE WHEN subscription_entitlements.revocation_reason='refund' AND subscription_entitlements.subscription_id=excluded.subscription_id THEN subscription_entitlements.subscription_id ELSE excluded.subscription_id END,plan_id=CASE WHEN subscription_entitlements.revocation_reason='refund' AND subscription_entitlements.subscription_id=excluded.subscription_id THEN subscription_entitlements.plan_id ELSE excluded.plan_id END,status=CASE WHEN subscription_entitlements.revocation_reason='refund' AND subscription_entitlements.subscription_id=excluded.subscription_id THEN 'revoked' ELSE excluded.status END,ends_at=CASE WHEN subscription_entitlements.revocation_reason='refund' AND subscription_entitlements.subscription_id=excluded.subscription_id THEN subscription_entitlements.ends_at ELSE excluded.ends_at END,revoked_at=CASE WHEN subscription_entitlements.revocation_reason='refund' AND subscription_entitlements.subscription_id=excluded.subscription_id THEN subscription_entitlements.revoked_at ELSE excluded.revoked_at END,revocation_reason=CASE WHEN subscription_entitlements.revocation_reason='refund' AND subscription_entitlements.subscription_id=excluded.subscription_id THEN subscription_entitlements.revocation_reason ELSE excluded.revocation_reason END,updated_at=excluded.updated_at WHERE NOT EXISTS (SELECT 1 FROM subscription_orders WHERE id=? AND status='refunded')`).bind(ownerId,subId,event.planId,entitlement.status,event.currentPeriodStart??at,entitlement.endsAt??null,null,null,livemode?1:0,at,order.id,order.id),
      db.prepare(`UPDATE subscription_orders SET status=CASE WHEN ? IN ('active','trialing') THEN 'completed' ELSE status END,provider_customer_id=?,provider_subscription_id=?,updated_at=? WHERE id=? AND status<>'refunded'`).bind(event.status,event.customerId,event.subscriptionId,at,order.id),
    ]); return;
  }
  if(event.kind==="invoice_paid"||event.kind==="invoice_payment_failed"){
    const sub=await db.prepare(`SELECT s.*,o.status source_order_status,o.stripe_livemode source_order_livemode FROM subscriptions s LEFT JOIN subscription_orders o ON o.id=s.source_order_id WHERE s.provider_subscription_id=?`).bind(event.subscriptionId).first<SubscriptionRow & {source_order_status:string|null;source_order_livemode:number|null}>(); if(!sub) throw new Error("SUBSCRIPTION_NOT_FOUND");
    if(sub.source_order_status==="refunded") return;
    if(Boolean(sub.source_order_livemode)!==livemode)throw new Error("SUBSCRIPTION_EVENT_MODE_MISMATCH");
    const plan=subscriptionPlan(sub.plan_id); const validProration=event.billingReason==="subscription_update"&&event.amountCents>=0;
    if(!plan||event.customerId!==sub.provider_customer_id||(!validProration&&event.amountCents!==plan.amountCents)||event.currency!==plan.currency) throw new Error("SUBSCRIPTION_INVOICE_MISMATCH");
    const chargeId=`charge_${event.invoiceId}`; const status=event.kind==="invoice_paid"?"paid":"failed";
    const statements=[db.prepare(`INSERT INTO subscription_charges(id,subscription_id,owner_id,provider_invoice_id,provider_payment_intent_id,provider_charge_id,amount_cents,amount_refunded_cents,currency,status,stripe_livemode,charged_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,0,?,?,?,?,?,?) ON CONFLICT(provider_invoice_id) DO UPDATE SET provider_payment_intent_id=excluded.provider_payment_intent_id,provider_charge_id=excluded.provider_charge_id,amount_cents=excluded.amount_cents,status=excluded.status,stripe_livemode=excluded.stripe_livemode,charged_at=excluded.charged_at,updated_at=excluded.updated_at`).bind(chargeId,sub.id,sub.owner_id,event.invoiceId,event.paymentIntentId??null,event.chargeId??null,event.amountCents,event.currency,status,livemode?1:0,event.chargedAt??null,at,at)];
    if(event.kind==="invoice_paid") {
      const chargedAt=event.chargedAt??at;
      const firstPaidWindow=Math.abs(Date.parse(chargedAt)-Date.parse(sub.created_at))<=7*86_400_000;
      const existingRollover=await db.prepare(`SELECT 1 ok FROM welcome_credit_rollovers WHERE owner_id=? UNION SELECT 1 ok FROM post_trial_ai_credits WHERE owner_id=?`).bind(sub.owner_id,sub.owner_id).first<{ok:number}>();
      if(!existingRollover&&firstPaidWindow){
        const trial=await db.prepare(`SELECT starts_at,ends_at,ai_credits FROM promotional_entitlements WHERE owner_id=? AND kind='welcome_trial' ORDER BY created_at DESC LIMIT 1`).bind(sub.owner_id).first<{starts_at:string;ends_at:string;ai_credits:number|null}>();
        if(trial){
          const trialCutoff=new Date(Math.min(Date.parse(chargedAt),Date.parse(trial.ends_at))).toISOString();
          const spent=await db.prepare(`SELECT COALESCE(SUM(COALESCE(credit_units,cost_units)),0) total,COALESCE(SUM(CASE WHEN quota_period=? THEN COALESCE(credit_units,cost_units) ELSE 0 END),0) period_total FROM ai_operations WHERE owner_id=? AND status='succeeded' AND created_at>=? AND created_at<?`).bind(chargedAt.slice(0,7),sub.owner_id,trial.starts_at,trialCutoff).first<{total:number;period_total:number}>();
          const rollover=welcomeCreditRollover({grantedCredits:Number(trial.ai_credits??0),spentBeforePaid:Number(spent?.total??0),conversionPeriod:chargedAt.slice(0,7),spentInConversionPeriod:Number(spent?.period_total??0)});
          if(rollover.remainingCredits>0) statements.push(
            db.prepare(`INSERT OR IGNORE INTO welcome_credit_rollovers(owner_id,subscription_id,granted_units,spent_before_paid,initial_remaining_units,remaining_units,conversion_period,conversion_period_used,created_at) VALUES(?,?,?,?,?,?,?,?,?)`).bind(sub.owner_id,sub.id,Number(trial.ai_credits??0),Math.min(Number(trial.ai_credits??0),Number(spent?.total??0)),rollover.remainingCredits,rollover.remainingCredits,rollover.conversionPeriod,rollover.spentInConversionPeriod,chargedAt),
            db.prepare(`UPDATE welcome_credit_rollovers SET spent_before_paid=MIN(granted_units,COALESCE((SELECT SUM(COALESCE(credit_units,cost_units)) FROM ai_operations WHERE owner_id=? AND status='succeeded' AND created_at>=? AND created_at<?),0)),initial_remaining_units=MAX(0,granted_units-MIN(granted_units,COALESCE((SELECT SUM(COALESCE(credit_units,cost_units)) FROM ai_operations WHERE owner_id=? AND status='succeeded' AND created_at>=? AND created_at<?),0))),remaining_units=MAX(0,granted_units-MIN(granted_units,COALESCE((SELECT SUM(COALESCE(credit_units,cost_units)) FROM ai_operations WHERE owner_id=? AND status='succeeded' AND created_at>=? AND created_at<?),0))),conversion_period_used=COALESCE((SELECT SUM(COALESCE(credit_units,cost_units)) FROM ai_operations WHERE owner_id=? AND status='succeeded' AND quota_period=? AND created_at>=? AND created_at<?),0) WHERE owner_id=? AND subscription_id=? AND created_at=? AND remaining_units=initial_remaining_units`).bind(sub.owner_id,trial.starts_at,trialCutoff,sub.owner_id,trial.starts_at,trialCutoff,sub.owner_id,trial.starts_at,trialCutoff,sub.owner_id,chargedAt.slice(0,7),trial.starts_at,trialCutoff,sub.owner_id,sub.id,chargedAt),
          );
        }
      }
      statements.push(
        db.prepare(`UPDATE promotional_entitlements SET status='ended',updated_at=? WHERE owner_id=? AND kind='welcome_trial' AND status='active'`).bind(chargedAt,sub.owner_id),
        db.prepare(`UPDATE subscriptions SET status='active',updated_at=? WHERE id=? AND NOT EXISTS (SELECT 1 FROM subscription_orders WHERE id=subscriptions.source_order_id AND status='refunded')`).bind(at,sub.id),
        db.prepare(`UPDATE subscription_entitlements SET status='active',revoked_at=NULL,revocation_reason=NULL,updated_at=? WHERE owner_id=? AND subscription_id=? AND revocation_reason IS NULL AND NOT EXISTS (SELECT 1 FROM subscriptions s JOIN subscription_orders o ON o.id=s.source_order_id WHERE s.id=? AND o.status='refunded')`).bind(at,sub.owner_id,sub.id,sub.id),
      );
    }
    if(event.kind==="invoice_payment_failed") statements.push(db.prepare(`UPDATE subscriptions SET status='past_due',updated_at=? WHERE id=? AND NOT EXISTS (SELECT 1 FROM subscription_orders WHERE id=subscriptions.source_order_id AND status='refunded')`).bind(at,sub.id),db.prepare(`UPDATE subscription_entitlements SET status='suspended',updated_at=? WHERE owner_id=? AND subscription_id=? AND NOT EXISTS (SELECT 1 FROM subscriptions s JOIN subscription_orders o ON o.id=s.source_order_id WHERE s.id=? AND o.status='refunded')`).bind(at,sub.owner_id,sub.id,sub.id));
    await db.batch(statements); return;
  }
  if(event.kind==="charge_refunded"){
    const charge=await db.prepare(`SELECT c.*,o.stripe_livemode FROM subscription_charges c JOIN subscriptions s ON s.id=c.subscription_id JOIN subscription_orders o ON o.id=s.source_order_id WHERE c.provider_charge_id=? OR c.provider_payment_intent_id=? ORDER BY c.created_at DESC LIMIT 1`).bind(event.chargeId,event.paymentIntentId??"").first<SubscriptionChargeRow & {stripe_livemode:number}>(); if(!charge) throw new Error("SUBSCRIPTION_CHARGE_NOT_FOUND");
    if(Boolean(charge.stripe_livemode)!==livemode)throw new Error("SUBSCRIPTION_EVENT_MODE_MISMATCH");
    if(event.currency!==charge.currency||event.amountRefundedCents>charge.amount_cents) throw new Error("SUBSCRIPTION_REFUND_MISMATCH");
    const status=event.amountRefundedCents===charge.amount_cents?"refunded":"partially_refunded";
    const statements=[db.prepare(`UPDATE subscription_charges SET amount_refunded_cents=?,status=?,updated_at=? WHERE id=?`).bind(event.amountRefundedCents,status,at,charge.id)];
    if(status==="refunded") statements.push(db.prepare(`UPDATE subscription_entitlements SET status='revoked',revoked_at=?,revocation_reason='refund',ends_at=?,updated_at=? WHERE subscription_id=?`).bind(at,at,at,charge.subscription_id),db.prepare(`UPDATE subscriptions SET status='canceled',cancel_at_period_end=0,current_period_end=?,updated_at=? WHERE id=?`).bind(at,at,charge.subscription_id),db.prepare(`UPDATE subscription_orders SET status='refunded',updated_at=? WHERE provider_subscription_id=(SELECT provider_subscription_id FROM subscriptions WHERE id=?)`).bind(at,charge.subscription_id),db.prepare(`UPDATE subscription_refund_requests SET status='processed',updated_at=? WHERE charge_id=? AND status IN ('requested','approved')`).bind(at,charge.id));
    await db.batch(statements); return;
  }
}

export async function subscriptionSummaryForOwner(ownerId:string,livemode=false){
  const db=commerceDb();const mode=livemode?1:0;
  const latestOrder=await db.prepare(`SELECT * FROM subscription_orders WHERE owner_id=? AND stripe_livemode=? ORDER BY created_at DESC LIMIT 1`).bind(ownerId,mode).first<SubscriptionOrderRow>();
  const subscription=await db.prepare(`SELECT * FROM subscriptions WHERE owner_id=? AND stripe_livemode=? ORDER BY updated_at DESC LIMIT 1`).bind(ownerId,mode).first<SubscriptionRow>();
  const entitlement=await db.prepare(`SELECT * FROM subscription_entitlements WHERE owner_id=? AND stripe_livemode=?`).bind(ownerId,mode).first<Record<string,unknown>>();
  const latestCharge=subscription?await db.prepare(`SELECT * FROM subscription_charges WHERE subscription_id=? ORDER BY created_at DESC LIMIT 1`).bind(subscription.id).first<SubscriptionChargeRow>():null;
  return {latestOrder:latestOrder??null,subscription:subscription??null,entitlement:entitlement??null,latestCharge:latestCharge??null};
}
export async function markSubscriptionCancelAtPeriodEnd(providerSubscriptionId:string,currentPeriodEnd?:string){const at=nowIso();await commerceDb().batch([commerceDb().prepare(`UPDATE subscriptions SET cancel_at_period_end=1,current_period_end=COALESCE(?,current_period_end),updated_at=? WHERE provider_subscription_id=?`).bind(currentPeriodEnd??null,at,providerSubscriptionId),commerceDb().prepare(`UPDATE subscription_entitlements SET ends_at=COALESCE(?,ends_at),updated_at=? WHERE subscription_id=(SELECT id FROM subscriptions WHERE provider_subscription_id=?)`).bind(currentPeriodEnd??null,at,providerSubscriptionId)]);}
export async function requestSubscriptionRefund(input:{ownerId:string;chargeId:string;reason:string}){
  const db=commerceDb(); const at=nowIso();
  const charge=await db.prepare(`SELECT * FROM subscription_charges WHERE id=? AND owner_id=? AND status='paid'`).bind(input.chargeId,input.ownerId).first<SubscriptionChargeRow>();
  if(!charge||!charge.charged_at) throw new Error("SUBSCRIPTION_CHARGE_NOT_ELIGIBLE");
  const usage=await db.prepare(`SELECT COALESCE(SUM(COALESCE(credit_units,cost_units)),0) used FROM ai_operations WHERE owner_id=? AND status='succeeded' AND created_at>=?`).bind(input.ownerId,charge.charged_at).first<{used:number}>();
  const used=Number(usage?.used??0); const eligibility=subscriptionRefundEligibility({chargedAt:charge.charged_at,aiCreditsUsed:used,alreadyRefunded:charge.amount_refunded_cents>0});
  if(!eligibility.eligible) throw new Error(eligibility.reason??"SUBSCRIPTION_REFUND_NOT_ELIGIBLE");
  const requestId=id("subref");
  await db.prepare(`INSERT OR IGNORE INTO subscription_refund_requests(id,owner_id,charge_id,reason,ai_credits_used,status,created_at,updated_at) VALUES(?,?,?,?,?,'requested',?,?)`).bind(requestId,input.ownerId,charge.id,input.reason.slice(0,500),used,at,at).run();
  return db.prepare(`SELECT id,charge_id,status,ai_credits_used,created_at FROM subscription_refund_requests WHERE owner_id=? AND charge_id=?`).bind(input.ownerId,charge.id).first();
}
export async function activeProEntitlement(ownerId:string,livemode=false,at=nowIso()){return commerceDb().prepare(`SELECT * FROM subscription_entitlements WHERE owner_id=? AND stripe_livemode=? AND status='active' AND (ends_at IS NULL OR ends_at>?)`).bind(ownerId,livemode?1:0,at).first<Record<string,unknown>>();}

export async function resolveCapabilities(ownerId: string, at = new Date()) {
  return (await resolveCommercialAccess(ownerId, at)).capabilities;
}
