import { readFileSync, readdirSync, mkdirSync, writeFileSync, existsSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import { buildProductDeliveries, digitalProduct, generationVersionForProduct } from "../src/lib/commercial/products.ts";
import { validateProductArtifactTemplate } from "../src/lib/commercial/processor.ts";

const root = resolve(process.argv[2] ?? "");
const helperDir = resolve(root, "publisher-worker");
const marker = resolve(helperDir, "active.json");
const wrangler = (...args: string[]) => execFileSync(process.execPath, [resolve("node_modules/wrangler/bin/wrangler.js"), ...args], { encoding: "utf8", maxBuffer: 8_000_000 });
async function cleanup() {
  if (!existsSync(marker)) return;
  const active = JSON.parse(readFileSync(marker, "utf8"));
  if (!/^hskkit-artifacts-[a-z0-9-]+$/.test(active.name) || active.config !== resolve(helperDir, "wrangler.json")) throw Error("INVALID_TEMPORARY_PUBLISHER");
  const account = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!account || !/^[a-f0-9]{32}$/.test(account) || !process.env.CLOUDFLARE_API_TOKEN) throw Error("PUBLISHER_CLEANUP_CREDENTIAL_MISSING");
  // Delete only this helper script; Wrangler delete also queries unrelated KV namespaces.
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/${active.name}?force=true`, { method: "DELETE", headers: { authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}` }, signal: AbortSignal.timeout(30000) });
  if (!response.ok && response.status !== 404) throw Error(`PUBLISHER_CLEANUP_HTTP_${response.status}`);
  unlinkSync(marker);
  console.log("Temporary artifact publisher removed");
}
if (process.argv.includes("--cleanup-only")) { await cleanup(); process.exit(0); }
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
  mkdirSync(helperDir, { recursive: true });
  const token = randomBytes(32).toString("base64url");
  if (process.env.GITHUB_ACTIONS) console.log(`::add-mask::${token}`);
  const name = `hskkit-artifacts-${process.env.GITHUB_RUN_ID ?? "local"}-${randomBytes(6).toString("hex")}`;
  const approved = Object.fromEntries(files.map(file => [file.key.replace(/^hskkit-commercial-exports\//, ""), {
    sha256: file.sha256, bytes: readFileSync(file.local).byteLength,
    contentType: file.file.endsWith(".json") ? "application/json" : file.file.endsWith(".pdf") ? "application/pdf" : "application/zip",
  }]));
  const config = resolve(helperDir, "wrangler.json");
  writeFileSync(config, JSON.stringify({ name, account_id: process.env.CLOUDFLARE_ACCOUNT_ID, main: fileURLToPath(new URL("./reviewed-vocabulary-publisher-worker.mjs", import.meta.url)), compatibility_date: "2026-05-24", workers_dev: true, preview_urls: false, r2_buckets: [{ binding: "BUCKET", bucket_name: "hskkit-commercial-exports" }], vars: { RUN_TOKEN_SHA256: sha(new TextEncoder().encode(token)), EXPIRES_AT: String(Date.now() + 15 * 60_000), APPROVED_ARTIFACTS: JSON.stringify(approved) } }));
  writeFileSync(marker, JSON.stringify({ name, config }));
  try {
    const output = wrangler("deploy", "--config", config);
    console.log(output);
    const origin = output.match(/https:\/\/[a-z0-9.-]+\.workers\.dev/)?.[0];
    if (!origin) throw Error("PUBLISHER_URL_MISSING");
    async function request(key: string, method: "GET" | "PUT", bytes?: Uint8Array) {
      let error;
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          const response = await fetch(`${origin}/${encodeURI(key)}`, { method, headers: { authorization: `Bearer ${token}`, ...(bytes ? { "content-length": String(bytes.byteLength) } : {}) }, body: bytes, signal: AbortSignal.timeout(60000) });
          if (!response.ok) throw Error(`PUBLISHER_HTTP_${response.status}:${key}`);
          return response;
        } catch (e) { error = e; if (attempt < 4) await new Promise(done => setTimeout(done, 1000 * (attempt + 1))); }
      }
      throw error;
    }
    for (const file of files) {
      const key = file.key.replace(/^hskkit-commercial-exports\//, "");
      await (await request(key, "PUT", readFileSync(file.local))).arrayBuffer();
      const downloaded = new Uint8Array(await (await request(key, "GET")).arrayBuffer());
      if (sha(downloaded) !== file.sha256) throw Error(`REMOTE_ARTIFACT_MISMATCH:${file.key}`);
      console.log(`R2 read-back SHA-256 verified: ${file.key}`);
    }
  } finally {
    await cleanup();
  }
}
console.log(JSON.stringify({ status: dryRun ? "checked" : "published-and-read-back-verified", files: files.length, products: selected }));
