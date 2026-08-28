import assert from "node:assert/strict";
import test from "node:test";
import {readFile} from "node:fs/promises";
import {DIGITAL_PRODUCTS,generationVersionForProduct,productLicenseNotice} from "../src/lib/commercial/products.ts";

const teacherNotice="Single-purchaser classroom licence: the purchaser may adapt editable files and print or share student handouts only with learners they personally teach at one teaching site. No resale, public upload, shared-drive distribution, sublicensing, transfer or use by another teacher.";

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

test("teacher product has a bounded classroom licence while learner products remain personal",()=>{
  assert.equal(productLicenseNotice("teacher-lesson-plan-pack"),teacherNotice);
  for(const product of DIGITAL_PRODUCTS){
    if(product.id!=="teacher-lesson-plan-pack")assert.equal(productLicenseNotice(product.id),"Personal, non-transferable study and print use only.",product.id);
  }
  assert.equal(generationVersionForProduct("teacher-lesson-plan-pack"),"teacher-pack-v3");
  assert.equal(generationVersionForProduct("worksheet-pack"),"complete-vocabulary-v1");
});

test("Store, resource checkout, Terms and generated delivery use the selected product licence",async()=>{
  const [store,purchase,detailCheckout,terms,generator]=await Promise.all([
    readFile("src/app/store/page.tsx","utf8"),
    readFile("src/app/store/store-purchase.tsx","utf8"),
    readFile("src/app/store/[productId]/resource-product-checkout.tsx","utf8"),
    readFile("src/app/terms-of-service/page.tsx","utf8"),
    readFile("src/lib/commercial/product-generator.ts","utf8"),
  ]);
  assert.match(store,/Teacher Lesson Plan Pack uses a single-purchaser classroom licence/);
  assert.match(store,/sublicensing, transfer or use by another teacher/);
  assert.match(purchase,/View details and samples/);
  assert.match(detailCheckout,/productLicenseNotice\(productId\)/);
  assert.match(terms, /single-purchaser classroom licence/i);
  assert.match(terms, /another teacher/);
  assert.doesNotMatch(terms, /All content on HSKKit is provided for personal study use/);
  assert.match(terms, /Teacher Lesson Plan Pack classroom licence is the limited exception/);
  assert.match(terms, /Last updated: 2026-08-28/);
  assert.match(terms,/sublicensing, transfer or use by another teacher/i);
  assert.match(generator,/licenseNotice:productLicenseNotice\(product\.id\)/);
  assert.match(generator,/productLicenseNotice\(product\.id\)/);
});
