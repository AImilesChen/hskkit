import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path: string) => readFile(path, "utf8");

test("Store exposes the frozen 17-product matrix and sends every card through a real detail route", async () => {
  const [page, purchase, products,details] = await Promise.all([
    read("src/app/store/page.tsx"),
    read("src/app/store/store-purchase.tsx"),
    read("src/lib/commercial/products.ts"),
    read("src/lib/commercial/product-details.ts"),
  ]);

  assert.match(page, /Build a practical HSK 3\.0 study library/);
  assert.match(page, /publicCommerceConfig\(\(await getCloudflareContext/);
  assert.match(page, /<StorePurchase initialConfig=\{config\}/);
  assert.match(page, /config\.products\.map\(\(product,index\)/);
  assert.match(purchase, /useState<CommerceConfig\|null>\(initialConfig\)/);
  assert.match(products, /levelDefinitions/);
  assert.doesNotMatch(products, /level-8|level-9/);
  assert.match(products, /advanced-7-9/);
  assert.match(products, /complete-1-9/);
  for (const id of ["worksheet-pack","assessment-tracker","30-day-planner","practice-assessment-pack","learner-practice-toolkit","exam-preparation-bundle","teacher-lesson-plan-pack"]) assert.match(products,new RegExp(id));
  assert.match(purchase, /lg:grid-cols-3/);
  assert.match(purchase, /config\.products\.filter/);
  assert.match(purchase, /detail\.inside\.slice\(0,3\)/);
  assert.match(purchase, /View details and samples/);
  assert.match(details,/DIGITAL_PRODUCTS\.map/);
  assert.doesNotMatch(purchase, /mt-5 text-3xl font-extrabold/,"product value must lead; price must remain secondary");
  assert.match(purchase, /mt-4 text-lg font-extrabold tracking-tight text-slate-800/,"all card prices use the same restrained secondary hierarchy");
  assert.doesNotMatch(purchase, /<select/);
  assert.doesNotMatch(purchase, /pack-level/);
});

test("detail page owns the single explicit confirmation and preserves product identity", async () => {
  const [purchase,checkout]=await Promise.all([read("src/app/store/store-purchase.tsx"),read("src/app/store/[productId]/resource-product-checkout.tsx")]);
  assert.match(purchase,/href=\{`\/store\/\$\{product\.id\}`\}/);
  assert.doesNotMatch(purchase,/setSelectedId|Purchase confirmation/);
  assert.match(checkout,/body:JSON\.stringify\(\{productId,idempotencyKey/);
  assert.match(checkout,/location\.assign\(`\/login\?returnTo=/);
  assert.match(checkout,/disabled=\{!available\|\|!accepted\|\|busy\}/);
  assert.match(checkout,/Continue to secure checkout/);
  assert.match(checkout,/min-h-11/);
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
