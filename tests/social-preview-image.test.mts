import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const imageName = "og-image-hsk3-2026.png";

const pngDimensions = (bytes: Buffer) => {
  assert.equal(bytes.subarray(1, 4).toString("ascii"), "PNG");
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
};

test("global social metadata uses the versioned HSK 3.0 preview image", async () => {
  const layout = await readFile(new URL("src/app/layout.tsx", root), "utf8");

  assert.ok(layout.includes(`url: "/${imageName}"`));
  assert.ok(layout.includes(`images: ["/${imageName}"]`));
  assert.match(layout, /width: 1200/);
  assert.match(layout, /height: 630/);
  assert.doesNotMatch(layout, /url: "\/og-image\.png"/);
  assert.doesNotMatch(layout, /images: \["\/og-image\.png"\]/);
});

test("versioned social preview is a valid 1200 by 630 PNG", async () => {
  const bytes = await readFile(new URL(`public/${imageName}`, root));

  assert.deepEqual(pngDimensions(bytes), { width: 1200, height: 630 });
  assert.ok(bytes.length > 50_000, "preview should contain the complete rendered design");
});
