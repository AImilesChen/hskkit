import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { selectPackAssets, buildPackManifest, manifestStillAuthorized } from "../src/lib/commercial/catalog.ts";
import { generatePackPdf, generateOfflineZip } from "../src/lib/commercial/generator.ts";

test("pack selection is one released level, bounded, authorized and excludes audio without offline rights", () => {
  const selected = selectPackAssets(1);
  assert.equal(selected.level, 1);
  assert.ok(selected.words.length > 0 && selected.words.length <= 120);
  assert.ok(selected.exercises.length <= 20);
  assert.ok(selected.words.every((item) => item.publishStatus === "published" && item.qaStatus === "approved" && item.authorizationStatus === "authorized"));
  assert.deepEqual(selected.audio, []);
  assert.throws(() => selectPackAssets(9), /CONTENT_NOT_RELEASED/);
});

test("manifest is traceable and deterministic", () => {
  const selection = selectPackAssets(2);
  const first = buildPackManifest(selection, "batch15-test");
  const second = buildPackManifest(selection, "batch15-test");
  assert.deepEqual(first, second);
  assert.equal(first.standardVersion, "GF0025-2021");
  assert.ok(first.assets.every((asset) => asset.id && asset.version && asset.licenseRef && asset.sourceRef));
  assert.equal(manifestStillAuthorized(JSON.stringify(first)), true);
  assert.equal(manifestStillAuthorized(JSON.stringify({ ...first, assets: [{ ...first.assets[0], version: "withdrawn-version" }] })), false);
});

test("offline ZIP processor reuses an authorized ready PDF with the same entitlement, level, generation and manifest", async () => {
  const processor = await readFile("src/lib/commercial/processor.ts", "utf8");
  assert.match(processor, /job\.format === "zip"/);
  assert.match(processor, /kind='pdf_pack'.*format='pdf'.*level=\?.*generation_version=\?.*state='ready'.*expires_at>\?.*manifest_json=\?/s);
  assert.match(processor, /COMMERCIAL_EXPORTS_R2\.get\(reusable\.object_key\)/);
  assert.match(processor, /if \(!pdf\).*generatePackPdf/s);
});

test("real PDF and offline ZIP bytes are generated", async () => {
  const selection = selectPackAssets(1);
  const manifest = buildPackManifest(selection, "batch15-test");
  const font = new Uint8Array(await readFile("assets/fonts/HskKitSansSubset.ttf"));
  const emojiFont = new Uint8Array(await readFile("assets/fonts/HskKitEmoji.ttf"));
  // pdf-lib/fontkit maps Latin ligature glyphs to incomplete ToUnicode text.
  // The bundled CJK font therefore intentionally omits GSUB so exported text stays searchable byte-for-byte.
  assert.equal(new TextDecoder("latin1").decode(font).includes("GSUB"), false);
  const pdf = await generatePackPdf(selection, manifest, font, emojiFont);
  assert.equal(new TextDecoder().decode(pdf.slice(0, 5)), "%PDF-");
  assert.ok(pdf.byteLength > 10_000);
  const zip = generateOfflineZip(pdf, manifest);
  assert.equal(new TextDecoder().decode(zip.slice(0, 2)), "PK");
  assert.ok(zip.byteLength > pdf.byteLength);
});
