import assert from "node:assert/strict";
import test from "node:test";
import {readFile} from "node:fs/promises";
import {DIGITAL_PRODUCTS,generationVersionForProduct,productLicenseNotice} from "../src/lib/commercial/products.ts";

test("frozen Store catalog keeps the approved 17-product matrix and exact Test prices",()=>{
  const expected={
    "level-1":399,"level-2":599,"level-3":799,"level-4":1099,"level-5":1399,"level-6":1799,
    "starter-1-3":999,"progression-4-6":2999,"advanced-7-9":3999,"complete-1-9":4999,
    "worksheet-pack":1299,"assessment-tracker":499,"30-day-planner":699,"practice-assessment-pack":1699,
    "learner-practice-toolkit":1699,"exam-preparation-bundle":2499,"teacher-lesson-plan-pack":1999,
  } as const;
  assert.equal(DIGITAL_PRODUCTS.length,17);
  assert.deepEqual(Object.fromEntries(DIGITAL_PRODUCTS.map(product=>[product.id,product.amountCents])),expected);
  assert.equal(DIGITAL_PRODUCTS.some(product=>product.id==="level-7"||product.id==="level-8"||product.id==="level-9"),false);
});

test("every Store product permits flexible printing but prohibits sale",()=>{
  for(const product of DIGITAL_PRODUCTS){
    const notice=productLicenseNotice(product.id);
    assert.match(notice,/print as many copies as needed/,product.id);
    assert.match(notice,/learners they teach/,product.id);
    assert.match(notice,/Printed copies and digital files may not be sold or resold/,product.id);
    assert.match(notice,/without a time limit/,product.id);
  }
  assert.match(productLicenseNotice("teacher-lesson-plan-pack"),/adapt the editable lesson-plan files/);
  assert.equal(generationVersionForProduct("teacher-lesson-plan-pack"),"teacher-pack-v3");
  assert.equal(generationVersionForProduct("worksheet-pack"),"worksheet-guided-v17");
  assert.equal(generationVersionForProduct("learner-practice-toolkit"),"learner-toolkit-current-v6");
  assert.equal(generationVersionForProduct("assessment-tracker"),"assessment-tracker-v5");
  assert.equal(generationVersionForProduct("exam-preparation-bundle"),"exam-preparation-current-v4");
});

test("Store, resource checkout, Terms and generated delivery use the selected product licence",async()=>{
  const [store,purchase,detailCheckout,terms,generator]=await Promise.all([
    readFile("src/app/store/page.tsx","utf8"),
    readFile("src/app/store/store-purchase.tsx","utf8"),
    readFile("src/app/store/[productId]/resource-product-checkout.tsx","utf8"),
    readFile("src/app/terms-of-service/page.tsx","utf8"),
    readFile("src/lib/commercial/product-generator.ts","utf8"),
  ]);
  assert.match(store,/Every Store purchaser may keep downloaded files without a time limit/);
  assert.match(store,/Printed copies and digital files may not be sold or resold/);
  assert.match(purchase,/View details and samples/);
  assert.match(detailCheckout,/productLicenseNotice\(productId\)/);
  assert.match(terms, /For every Store product/);
  assert.match(terms, /Printed copies and digital files may not be sold or resold/);
  assert.doesNotMatch(terms, /All content on HSKKit is provided for personal study use/);
  assert.match(terms, /The 14-day access window and three-download limit apply only to retrieving files/);
  assert.match(terms, /Last updated: 2026-10-05/);
  assert.match(terms,/a purchase does not transfer copyright ownership/i);
  assert.match(generator,/licenseNotice:productLicenseNotice\(product\.id\)/);
  assert.match(generator,/productLicenseNotice\(product\.id\)/);
});
