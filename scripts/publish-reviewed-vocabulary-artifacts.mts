import { readFileSync, readdirSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { buildProductDeliveries, digitalProduct, generationVersionForProduct } from "../src/lib/commercial/products.ts";
import { validateProductArtifactTemplate } from "../src/lib/commercial/processor.ts";

const root = resolve(process.argv[2] ?? "");
const expected = JSON.parse(readFileSync(new URL("../content/releases/reviewed-vocabulary-artifacts-20261101.json", import.meta.url), "utf8")) as { files: Array<{ productId: string; generationVersion: string; file: string; sha256: string }> };
const dryRun = process.argv.includes("--check-only");
const selected = (process.env.PRODUCT_IDS ?? "level-6,progression-4-6,advanced-7-9,complete-1-9").split(",");
const sha = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
const files: Array<{ local: string; key: string; sha256: string; file: string }> = [];
for (const productId of selected) {
  if (!["level-6", "progression-4-6", "advanced-7-9", "complete-1-9"].includes(productId)) throw Error("UNSUPPORTED_VOCABULARY_PRODUCT");
  const product = digitalProduct(productId)!;
  const version = generationVersionForProduct(productId);
  const dir = resolve(root, version, productId);
  const names: string[] = [];
  for (const delivery of buildProductDeliveries(productId)) {
    const file = `${delivery.deliveryKey}.${delivery.format}`;
    const sidecar = `${delivery.deliveryKey}.manifest.json`;
    const bytes = readFileSync(resolve(dir, file));
    const manifest = JSON.parse(readFileSync(resolve(dir, sidecar), "utf8"));
    validateProductArtifactTemplate(product, { generation_version: version, delivery_key: delivery.deliveryKey, format: delivery.format, level: delivery.level ?? null }, manifest, sha(bytes));
    names.push(file, sidecar);
  }
  if (JSON.stringify(readdirSync(dir).sort()) !== JSON.stringify(names.sort())) throw Error(`UNEXPECTED_DELIVERY_FILES:${productId}`);
  for (const file of names) {
    const local = resolve(dir, file), checksum = sha(readFileSync(local));
    const approved = expected.files.find(item => item.productId === productId && item.generationVersion === version && item.file === file);
    if (approved?.sha256 !== checksum) throw Error(`REVIEWED_ARTIFACT_MISMATCH:${productId}/${file}`);
    files.push({ local, key: `hskkit-commercial-exports/system/artifacts/${version}/${productId}/${file}`, sha256: checksum, file });
  }
}
// Validate every local artifact before any remote mutation.
if (!dryRun) {
  const verifyDir = resolve(root, "remote-verification");mkdirSync(verifyDir, { recursive: true });
  for (const [index, file] of files.entries()) {
    const contentType = file.file.endsWith(".json") ? "application/json" : file.file.endsWith(".pdf") ? "application/pdf" : "application/zip";
    const wrangler = (...args: string[]) => execFileSync(process.execPath, [resolve("node_modules/wrangler/bin/wrangler.js"), ...args], { stdio: "inherit" });
    wrangler("r2", "object", "put", file.key, "--file", file.local, "--content-type", contentType, "--remote");
    const downloaded = resolve(verifyDir, `${index}-${file.file}`);
    wrangler("r2", "object", "get", file.key, "--file", downloaded, "--remote");
    if (sha(readFileSync(downloaded)) !== file.sha256) throw Error(`REMOTE_ARTIFACT_MISMATCH:${file.key}`);
    console.log(`R2 read-back SHA-256 verified: ${file.key}`);
  }
}
console.log(JSON.stringify({ status: dryRun ? "checked" : "published-and-read-back-verified", files: files.length, products: selected }));
