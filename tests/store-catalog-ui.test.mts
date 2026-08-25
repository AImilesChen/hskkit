import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path: string) => readFile(path, "utf8");

test("Store exposes all seven released PDF packs as a responsive product catalog", async () => {
  const [page, purchase] = await Promise.all([
    read("src/app/store/page.tsx"),
    read("src/app/store/store-purchase.tsx"),
  ]);

  assert.match(page, /Choose your HSK 3\.0 PDF Study Pack/);
  assert.match(purchase, /const PACK_LEVELS=\[1,2,3,4,5,6,7\]/);
  assert.match(purchase, /lg:grid-cols-3/);
  assert.match(purchase, /120<\/strong> vocabulary entries/);
  assert.match(purchase, /20<\/strong> practice prompts/);
  assert.match(purchase, /Buy Level \{value\} Pack/);
  assert.doesNotMatch(purchase, /<select/);
  assert.doesNotMatch(purchase, /pack-level/);
  assert.doesNotMatch(purchase, /Level 8|Level 9/);
});

test("choosing a product opens one explicit confirmation step and preserves its level", async () => {
  const purchase = await read("src/app/store/store-purchase.tsx");

  assert.match(purchase, /setLevel\(value\)/);
  assert.match(purchase, /Review Level \{level\} purchase/);
  assert.match(purchase, /const submittedLevel=level/);
  assert.match(purchase, /body:JSON\.stringify\(\{level:submittedLevel,idempotencyKey/);
  assert.match(purchase, /disabled=\{busy\}/);
  assert.match(purchase, /if\(!config\?\.levelsAvailable\.includes\(level\)\)/);
  assert.match(purchase, /location\.assign\(`\/login\?returnTo=/);
  assert.match(purchase, /returnTo=\$\{encodeURIComponent\(`\/store\?level=\$\{submittedLevel\}`\)\}/);
  assert.match(purchase, /new URLSearchParams\(location\.search\)/);
  assert.match(purchase, /disabled=\{!commerceEnabled\|\|!accepted\|\|busy\}/);
  assert.match(purchase, /Continue to Stripe Test checkout/);
  assert.match(purchase, /min-h-11/);
});

test("Store places shared pack facts, Pro comparison and purchase FAQ after the catalog", async () => {
  const page = await read("src/app/store/page.tsx");
  const catalog = page.indexOf("<StorePurchase");
  const included = page.indexOf("What every pack includes");
  const pro = page.indexOf("PDF Pack or Pro?");
  const faq = page.indexOf("Frequently asked questions");

  assert.ok(catalog >= 0 && included > catalog && pro > included && faq > pro);
  for (const question of [
    "Is each level sold separately?",
    "Is this included in Pro?",
    "Does the pack include audio?",
    "How many downloads do I get?",
    "How long is the download available?",
    "Can I print the PDF?",
    "What happens if a download fails?",
    "What is the refund policy?",
  ]) assert.match(page, new RegExp(question.replace(/[?]/g, "\\?")));
  assert.match(page, /Compare Free and Pro/);
});
