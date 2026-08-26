import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  EXPORT_STATES,
  normalizePackCheckoutEvent,
  transitionExport,
} from "../src/lib/commercial/domain.ts";
import { validateProductArtifactTemplate } from "../src/lib/commercial/processor.ts";
import { digitalProduct } from "../src/lib/commercial/products.ts";
import { retryDelaySeconds } from "../src/lib/commercial/queue-retry.ts";

const read = (path: string) => readFile(path, "utf8");

test("2B pack checkout accepts only the frozen one-time Test-mode contract", () => {
  const event = normalizePackCheckoutEvent({
    id: "cs_test_pack",
    mode: "payment",
    payment_status: "paid",
    amount_total: 999,
    currency: "usd",
    payment_intent: "pi_test_pack",
    metadata: {
      order_id: "ord_pack",
      user_id: "user_pack",
      sku: "hskkit_advanced_study_pdf_pack_v1",
      selected_level: "3",
    },
  });
  assert.deepEqual(event, {
    sessionId: "cs_test_pack",
    orderId: "ord_pack",
    userId: "user_pack",
    sku: "hskkit_advanced_study_pdf_pack_v1",
    selectedLevel: 3,
    amountCents: 999,
    currency: "usd",
    paymentIntentId: "pi_test_pack",
  });
  assert.throws(() => normalizePackCheckoutEvent({ ...event, amount_total: 998 }), /PACK_CHECKOUT_MISMATCH/);
  assert.throws(() => normalizePackCheckoutEvent({ ...event, mode: "subscription" }), /PACK_CHECKOUT_MISMATCH/);
});

test("2B export state contract exposes every required terminal and non-terminal state", () => {
  assert.deepEqual(EXPORT_STATES, ["queued", "generating", "ready", "failed", "expired", "cancelled", "revoked"]);
  assert.equal(transitionExport("queued", "start"), "generating");
  assert.equal(transitionExport("generating", "complete"), "ready");
  assert.equal(transitionExport("generating", "fail"), "failed");
  assert.equal(transitionExport("ready", "expire"), "expired");
  assert.equal(transitionExport("queued", "cancel"), "cancelled");
  assert.equal(transitionExport("ready", "revoke"), "revoked");
});

test("2B webhook still grants PackPurchase when checkout-result reconciliation already marked the order paid", async () => {
  const storage = await read("src/lib/commercial/storage.ts");
  assert.match(storage, /if \(order\.status === "paid"\) \{\s*const existing = await getPackPurchaseForOrder\(order\.id,env\);\s*if \(existing\) return existing;\s*\}/);
  assert.match(storage, /status IN \('pending','failed','paid'\)/);
});

test("2B persists PackPurchase separately from subscription entitlement", async () => {
  const [migration, storage] = await Promise.all([
    read("migrations/0016_batch2b_pack_purchases.sql"),
    read("src/lib/commercial/storage.ts"),
  ]);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS pack_purchases/);
  assert.match(migration, /pack_purchase_id TEXT REFERENCES pack_purchases\(id\)/);
  assert.match(storage, /FROM pack_purchases/);
  assert.match(storage, /INSERT OR IGNORE INTO pack_purchases/);
  assert.doesNotMatch(storage, /subscription_entitlements[\s\S]{0,200}pack_purchase_id/);
});

test("2B Store is public/indexable while orders, exports and checkout results are noindex", async () => {
  const [store, sitemap, orders, exportsPage, checkoutSuccess, checkoutCancel] = await Promise.all([
    read("src/app/store/page.tsx"),
    read("src/app/sitemap.ts"),
    read("src/app/orders/page.tsx"),
    read("src/app/exports/page.tsx"),
    read("src/app/checkout/success/page.tsx"),
    read("src/app/checkout/cancel/page.tsx"),
  ]);
  assert.match(store, /canonical:\s*"\/store"/);
  assert.doesNotMatch(store, /index:\s*false/);
  assert.match(sitemap, /"\/store"/);
  for (const page of [orders, exportsPage, checkoutSuccess, checkoutCancel]) {
    assert.match(page, /robots:\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}/);
  }
});

test("2B uses a real queue consumer, private R2 and expires persisted jobs", async () => {
  const [workerConfig, workerEntry, artifactGenerator, processor, storage, download] = await Promise.all([
    read("wrangler.commercial-worker.jsonc"),
    read("workers/commercial-export-worker.ts"),
    read("scripts/generate-commercial-artifacts.mts"),
    read("src/lib/commercial/processor.ts"),
    read("src/lib/commercial/storage.ts"),
    read("src/app/api/v1/commercial/download/[token]/route.ts"),
  ]);
  assert.match(workerConfig, /"consumers"/);
  assert.match(workerConfig, /"hskkit-commercial-exports"/);
  assert.match(processor, /system\/artifacts\/\$\{job\.generation_version\}/);
  assert.match(processor, /PREGENERATED_ARTIFACT_NOT_AVAILABLE/);
  assert.match(artifactGenerator, /for\(const product of DIGITAL_PRODUCTS\)/);
  assert.match(workerEntry, /result\.skipped[\s\S]*message\.retry/);
  assert.match(processor, /private\/exports/);
  assert.match(storage, /state='expired'/);
  assert.match(storage, /DELETE FROM commercial_download_tokens/);
  assert.match(download, /arrayBuffer\(\)/);
  assert.match(download, /consumeSuccessfulDownload/);
  assert.ok(download.indexOf("arrayBuffer()") < download.indexOf("await consumeSuccessfulDownload"), "object bytes must be materialized before a successful download is counted");
});

test("pre-generated artifacts are bound to the paid product delivery and sidecar identity",()=>{
  const complete=digitalProduct("complete-1-9")!;
  const bundleJob={generation_version:"p0-p1-v1",delivery_key:"bundle-zip",format:"zip",level:null};
  const bundleManifest={schemaVersion:"hskkit-bundle-manifest-v1",productId:"complete-1-9",generationVersion:"p0-p1-v1",templateProductId:"complete-1-9",templateDeliveryKey:"bundle-zip",templateFormat:"zip",templateLevel:null};
  assert.equal(validateProductArtifactTemplate(complete,bundleJob,bundleManifest).deliveryKey,"bundle-zip");
  assert.equal(validateProductArtifactTemplate(complete,bundleJob,{...bundleManifest,templateChecksumSha256:"abc123"},"abc123").deliveryKey,"bundle-zip");
  assert.throws(()=>validateProductArtifactTemplate(complete,bundleJob,{...bundleManifest,templateChecksumSha256:"wrong"},"abc123"),/PREGENERATED_ARTIFACT_CHECKSUM_MISMATCH/);
  assert.throws(()=>validateProductArtifactTemplate(complete,bundleJob,bundleManifest,"abc123"),/PREGENERATED_ARTIFACT_CHECKSUM_MISMATCH/);
  assert.throws(()=>validateProductArtifactTemplate(complete,{...bundleJob,format:"pdf"},bundleManifest),/PRODUCT_DELIVERY_MISMATCH/);
  assert.throws(()=>validateProductArtifactTemplate(complete,{...bundleJob,delivery_key:"level-1",level:null},{schemaVersion:"hskkit-pack-manifest-v1",generationVersion:"p0-p1-v1",level:1}),/PRODUCT_DELIVERY_MISMATCH/);
  assert.throws(()=>validateProductArtifactTemplate(complete,bundleJob,{...bundleManifest,productId:"advanced-7-9"}),/PREGENERATED_ARTIFACT_IDENTITY_MISMATCH/);
  const levelJob={generation_version:"p0-p1-v1",delivery_key:"level-1",format:"pdf",level:1};
  const levelManifest={schemaVersion:"hskkit-pack-manifest-v1",generationVersion:"p0-p1-v1",level:1,templateProductId:"complete-1-9",templateDeliveryKey:"level-1",templateFormat:"pdf",templateLevel:1};
  assert.equal(validateProductArtifactTemplate(complete,levelJob,levelManifest).level,1);
  assert.throws(()=>validateProductArtifactTemplate(complete,levelJob,{...levelManifest,level:2}),/PREGENERATED_ARTIFACT_IDENTITY_MISMATCH/);
  assert.throws(()=>validateProductArtifactTemplate(complete,levelJob,{...levelManifest,templateProductId:"advanced-7-9"}),/PREGENERATED_ARTIFACT_IDENTITY_MISMATCH/);
  assert.throws(()=>validateProductArtifactTemplate(complete,levelJob,{...levelManifest,templateDeliveryKey:"level-2"}),/PREGENERATED_ARTIFACT_IDENTITY_MISMATCH/);
  const planner=digitalProduct("30-day-planner")!;
  assert.equal(validateProductArtifactTemplate(planner,{generation_version:"p0-p1-v1",delivery_key:"product",format:"pdf",level:null},{schemaVersion:"hskkit-product-manifest-v1",productId:"30-day-planner",generationVersion:"p0-p1-v1",templateProductId:"30-day-planner",templateDeliveryKey:"product",templateFormat:"pdf",templateLevel:null}).deliveryKey,"product");
});

test("queue retries skipped generating jobs only after their lease can expire",()=>{
  const now=Date.parse("2026-08-25T12:00:00.000Z");
  assert.equal(retryDelaySeconds("2026-08-25T12:05:00.000Z",now),305);
  assert.equal(retryDelaySeconds("2026-08-25T11:59:00.000Z",now),5);
  assert.equal(retryDelaySeconds(null,now),60);
});

test("refund and license withdrawal revoke access and delete private objects", async () => {
  const [webhook, downloadLink, download, adminRevoke, storage] = await Promise.all([
    read("src/app/api/v1/commercial/webhook/route.ts"),
    read("src/app/api/v1/commercial/exports/[id]/download-link/route.ts"),
    read("src/app/api/v1/commercial/download/[token]/route.ts"),
    read("src/app/api/v1/commercial/admin/pack-purchases/revoke/route.ts"),
    read("src/lib/commercial/storage.ts"),
  ]);
  assert.match(webhook, /revokePackPurchaseDelivery/);
  assert.match(downloadLink, /revokePackExportDelivery/);
  assert.match(download, /revokePackExportDelivery/);
  assert.match(adminRevoke, /revokePackPurchase/);
  assert.match(storage, /status='revoked'/);
  for (const source of [webhook, downloadLink, download, adminRevoke]) assert.match(source, /COMMERCIAL_EXPORTS_R2/);
  assert.match(webhook, /await env\.COMMERCIAL_EXPORTS_R2\.delete\(objectKey\);\s*if\(await env\.COMMERCIAL_EXPORTS_R2\.head\(objectKey\)\)\s*throw new Error\("REFUND_OBJECT_DELETE_FAILED"\);\s*await clearRevokedExportObjectKey\(objectKey\)/);
  assert.ok(webhook.indexOf("COMMERCIAL_EXPORTS_R2.head(objectKey)") < webhook.indexOf("clearRevokedExportObjectKey(objectKey)"), "the D1 object key must remain recoverable until R2 deletion is verified");
});
