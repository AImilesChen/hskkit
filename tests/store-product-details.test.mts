import assert from "node:assert/strict";
import {access,readFile} from "node:fs/promises";
import test from "node:test";

const root=new URL("../",import.meta.url);
test("every frozen product has one canonical detail route with readable real samples and matching price",async()=>{
  const [{DIGITAL_PRODUCTS},{storeProductDetails,storeProductDetail}]=await Promise.all([
    import("../src/lib/commercial/products.ts"),import("../src/lib/commercial/product-details.ts"),
  ]);
  assert.equal(storeProductDetails.length,DIGITAL_PRODUCTS.length);
  assert.equal(new Set(storeProductDetails.map(detail=>detail.slug)).size,DIGITAL_PRODUCTS.length);
  for(const product of DIGITAL_PRODUCTS){
    const detail=storeProductDetail(product.id);
    assert.ok(detail,`missing detail ${product.id}`);
    assert.equal(detail.id,product.id);
    assert.equal(detail.slug,product.id);
    assert.equal(detail.amountCents,product.amountCents);
    assert.ok(detail.summary.length>40);
    assert.ok(detail.inside.length>=2);
    assert.ok(detail.samplePages.length>=2,`missing readable samples ${product.id}`);
    for(const sample of detail.samplePages){
      assert.match(sample.src,/^\/store\/samples\//);
      await access(new URL(`public${sample.src}`,root));
      assert.ok(sample.alt.length>20&&sample.caption.length>20);
    }
  }
});

test("the dynamic Store route prebuilds all products and rejects unknown IDs",async()=>{
  const [page,view]=await Promise.all([readFile(new URL("src/app/store/[productId]/page.tsx",root),"utf8"),readFile(new URL("src/app/store/[productId]/resource-product-detail.tsx",root),"utf8")]);
  assert.match(page,/storeProductDetails\.map/);
  assert.match(page,/storeProductDetail\(productId\)/);
  assert.match(page,/if\(!product\)notFound\(\)/);
  assert.match(view,/ResourceProductCheckout/);
});
