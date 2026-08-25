import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { commercialPolicy, refundEligibility, canIssueDownload, transitionExport } from "../src/lib/commercial/domain.ts";

test("commercial policy is Stripe Test only and freezes live mode", () => {
  assert.equal(commercialPolicy({ COMMERCE_MODE: "test", STRIPE_SECRET_KEY: "sk_test_redacted", EXPORT_SIGNING_SECRET: "x".repeat(32) }).enabled, true);
  assert.equal(commercialPolicy({ COMMERCE_MODE: "live", STRIPE_SECRET_KEY: "sk_live_redacted", EXPORT_SIGNING_SECRET: "x".repeat(32) }).enabled, false);
  assert.equal(commercialPolicy({ COMMERCE_MODE: "test", STRIPE_SECRET_KEY: "", EXPORT_SIGNING_SECRET: "x".repeat(32) }).enabled, false);
});

test("PDF Pack refund is eligible only within seven UTC days and before any successful download", () => {
  const purchasedAt = "2026-08-20T12:00:00.000Z";
  assert.equal(refundEligibility({ purchasedAt, successfulDownloads: 0, alreadyRefunded: false }, new Date("2026-08-27T11:59:59.000Z")).eligible, true);
  assert.equal(refundEligibility({ purchasedAt, successfulDownloads: 1, alreadyRefunded: false }, new Date("2026-08-21T00:00:00.000Z")).code, "ALREADY_DOWNLOADED");
  assert.equal(refundEligibility({ purchasedAt, successfulDownloads: 0, alreadyRefunded: false }, new Date("2026-08-28T00:00:00.000Z")).code, "REFUND_WINDOW_EXPIRED");
});

test("download issuance enforces ownership, PackPurchase, revocation, expiry and limit", () => {
  const base = { actorUserId: "u1", ownerUserId: "u1", packPurchaseStatus: "active", jobState: "ready", expiresAt: "2026-09-01T00:00:00.000Z", successfulDownloads: 2, downloadLimit: 3 } as const;
  assert.equal(canIssueDownload(base, new Date("2026-08-25T00:00:00.000Z")).allowed, true);
  assert.equal(canIssueDownload({ ...base, actorUserId: "u2" }, new Date("2026-08-25T00:00:00.000Z")).code, "ACCESS_DENIED");
  assert.equal(canIssueDownload({ ...base, successfulDownloads: 3 }, new Date("2026-08-25T00:00:00.000Z")).code, "DOWNLOAD_LIMIT_REACHED");
  assert.equal(canIssueDownload({ ...base, packPurchaseStatus: "revoked" }, new Date("2026-08-25T00:00:00.000Z")).code, "PACK_PURCHASE_REVOKED");
});

test("export lifecycle is explicit and cancellation cannot become ready", () => {
  assert.equal(transitionExport("queued", "start"), "generating");
  assert.equal(transitionExport("generating", "complete"), "ready");
  assert.equal(transitionExport("queued", "cancel"), "cancelled");
  assert.throws(() => transitionExport("cancelled", "complete"), /INVALID_EXPORT_TRANSITION/);
});

test("download debit uses a single-use CAS and transactional entitlement reservation", async () => {
  const [storage, route, webhook, processor, exportsRoute, sitemap, purchaseUi] = await Promise.all([
    readFile("src/lib/commercial/storage.ts", "utf8"),
    readFile("src/app/api/v1/commercial/download/[token]/route.ts", "utf8"),
    readFile("src/app/api/v1/commercial/webhook/route.ts", "utf8"),
    readFile("src/lib/commercial/processor.ts", "utf8"),
    readFile("src/app/api/v1/commercial/exports/route.ts", "utf8"),
    readFile("src/app/sitemap.ts", "utf8"),
    readFile("src/app/store/store-purchase.tsx", "utf8"),
  ]);
  assert.match(storage, /UPDATE commercial_download_tokens SET consumed_at=\?/);
  assert.match(storage, /claim\.meta\.changes!==1/);
  assert.match(storage, /INSERT INTO commercial_download_ledger[\s\S]*SELECT \?,\?,\?,\?,\?,\?,\?,\? FROM pack_purchases/);
  assert.match(storage, /const \[claim,ledger,debit\]=await db\.batch/);
  assert.match(storage, /claim\.meta\.changes!==1\|\|ledger\.meta\.changes!==1\|\|debit\.meta\.changes!==1/);
  assert.doesNotMatch(storage, /SELECT consumed_at FROM commercial_download_tokens/);
  assert.match(route, /code==="CONTENT_RIGHTS_CHANGED"\?410/);
  assert.match(storage, /stripe_checkout_session_id=\? OR \(id=\? AND stripe_checkout_session_id IS NULL\)/);
  assert.match(storage, /ORDER_METADATA_MISMATCH/);
  assert.match(webhook, /normalizePackCheckoutEvent/);
  assert.match(webhook, /orderId:pack\.orderId/);
  assert.match(webhook, /expectedSelectedLevel:pack\.selectedLevel/);
  assert.match(processor, /if\(!committed\) throw new Error\("EXPORT_LEASE_LOST"\)/);
  assert.match(processor, /if\(objectKey\) await env\.COMMERCIAL_EXPORTS_R2\.delete\(objectKey\)/);
  assert.match(exportsRoute, /code==="LEVEL_NOT_PURCHASED"\|\|code==="PRODUCT_NOT_PURCHASED"\?403/);
  assert.match(sitemap, /"\/pricing"/);
  assert.match(sitemap, /"\/store"/);
  assert.match(purchaseUi, /fetch\("\/api\/v1\/commercial\/config"/);
  assert.match(purchaseUi, /disabled=\{!config\.enabled\|\|!accepted\|\|busy\}/);
  assert.match(purchaseUi, /Stripe Test checkout/);
});
