import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path: string) => readFile(path, "utf8");

test("Store exposes the complete Level 1–9, Bundle, and resource catalog responsively", async () => {
  const [page, purchase, products] = await Promise.all([
    read("src/app/store/page.tsx"),
    read("src/app/store/store-purchase.tsx"),
    read("src/lib/commercial/products.ts"),
  ]);

  assert.match(page, /Build a practical HSK 3\.0 study library/);
  assert.match(products, /Array\.from\(\{length:9\}/);
  assert.match(products, /advanced-7-9/);
  assert.match(products, /complete-1-9/);
  for (const id of ["worksheet-pack","assessment-tracker","30-day-planner","mock-exam-pack","teacher-lesson-plan-pack"]) assert.match(products,new RegExp(id));
  assert.match(purchase, /lg:grid-cols-3/);
  assert.match(purchase, /config\.products\.filter/);
  assert.match(purchase, /product\.deliverables\.map/);
  assert.doesNotMatch(purchase, /<select/);
  assert.doesNotMatch(purchase, /pack-level/);
});

test("choosing a product opens one explicit confirmation step and preserves its identity", async () => {
  const purchase = await read("src/app/store/store-purchase.tsx");

  assert.match(purchase, /setSelectedId\(productId\)/);
  assert.match(purchase, /Review \{selected\.name\}/);
  assert.match(purchase, /body:JSON\.stringify\(\{productId:selected\.id,idempotencyKey/);
  assert.match(purchase, /disabled=\{busy\}/);
  assert.match(purchase, /data\.products\.some\(p=>p\.id===requested\)/);
  assert.match(purchase, /location\.assign\(`\/login\?returnTo=/);
  assert.match(purchase, /`\/store\?product=\$\{selected\.id\}`/);
  assert.match(purchase, /new URLSearchParams\(location\.search\)/);
  assert.match(purchase, /disabled=\{!config\.enabled\|\|!accepted\|\|busy\}/);
  assert.match(purchase, /Continue to Stripe Test checkout/);
  assert.match(purchase, /min-h-11/);
});

test("Store places shared pack facts, Pro comparison and purchase FAQ after the catalog", async () => {
  const page = await read("src/app/store/page.tsx");
  const catalog = page.indexOf("<StorePurchase");
  const included = page.indexOf("Delivery rules stay clear");
  const pro = page.indexOf("Store product or Pro?");
  const faq = page.indexOf("Frequently asked questions");

  assert.ok(catalog >= 0 && included > catalog && pro > included && faq > pro);
  for (const question of [
    "What can I buy?",
    "How do Bundle downloads work?",
    "Is this included in Pro?",
    "Do the products include audio?",
    "How long is access available?",
    "What happens if a download fails?",
    "Can I buy the same product twice?",
    "What is the refund policy?",
  ]) assert.match(page, new RegExp(question.replace(/[?]/g, "\\?")));
  assert.match(page, /Compare Free and Pro/);
});
