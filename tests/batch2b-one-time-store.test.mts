import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  EXPORT_STATES,
  normalizePackCheckoutEvent,
  transitionExport,
} from "../src/lib/commercial/domain.ts";

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
  const [workerConfig, processor, storage, download] = await Promise.all([
    read("wrangler.commercial-worker.jsonc"),
    read("src/lib/commercial/processor.ts"),
    read("src/lib/commercial/storage.ts"),
    read("src/app/api/v1/commercial/download/[token]/route.ts"),
  ]);
  assert.match(workerConfig, /"consumers"/);
  assert.match(workerConfig, /"hskkit-commercial-exports"/);
  assert.match(processor, /private\/exports/);
  assert.match(storage, /state='expired'/);
  assert.match(storage, /DELETE FROM commercial_download_tokens/);
  assert.match(download, /arrayBuffer\(\)/);
  assert.match(download, /consumeSuccessfulDownload/);
  assert.ok(download.indexOf("arrayBuffer()") < download.indexOf("await consumeSuccessfulDownload"), "object bytes must be materialized before a successful download is counted");
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
});
