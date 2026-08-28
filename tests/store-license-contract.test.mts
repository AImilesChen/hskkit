import assert from "node:assert/strict";
import test from "node:test";
import {readFile} from "node:fs/promises";
import {DIGITAL_PRODUCTS,generationVersionForProduct,productLicenseNotice} from "../src/lib/commercial/products.ts";

const teacherNotice="Single-purchaser classroom licence: the purchaser may adapt editable files and print or share student handouts only with learners they personally teach at one teaching site. No resale, public upload, shared-drive distribution, sublicensing, transfer or use by another teacher.";

test("frozen Store catalog keeps exactly 16 products and exact Test prices",()=>{
  assert.equal(DIGITAL_PRODUCTS.length,16);
  for(const product of DIGITAL_PRODUCTS){
    const expected=product.id==="advanced-7-9"?2499:product.id==="complete-1-9"?6499:999;
    assert.equal(product.amountCents,expected,product.id);
  }
});

test("teacher product has a bounded classroom licence while learner products remain personal",()=>{
  assert.equal(productLicenseNotice("teacher-lesson-plan-pack"),teacherNotice);
  for(const product of DIGITAL_PRODUCTS){
    if(product.id!=="teacher-lesson-plan-pack")assert.equal(productLicenseNotice(product.id),"Personal, non-transferable study and print use only.",product.id);
  }
  assert.equal(generationVersionForProduct("teacher-lesson-plan-pack"),"teacher-pack-v3");
  assert.equal(generationVersionForProduct("worksheet-pack"),"p0-p1-v2");
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
  assert.match(purchase,/productLicenseNotice\(selected\.id\)/);
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
