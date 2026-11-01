import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { buildProductDeliveries, generationVersionForProduct } from "../src/lib/commercial/products.ts";

type ApprovedFile = { productId: string; generationVersion: string; file: string; sha256: string };
type ApprovedRelease = { schemaVersion: number; files: ApprovedFile[] };
type Publication = {
  schemaVersion: number; bucket: string; prefix: string; artifactManifestSha256: string;
  batches: Array<{ generationVersion: string; productIds: string[]; uploadedFileCount: number; observedResult: string }>;
  readBackScope: string;
  readBackSamples: Array<ApprovedFile & { bytes: number; sourceAssetCount: number; zipInternalChecksumsVerified: boolean }>;
};
export const approvedRelease: ApprovedRelease = JSON.parse(readFileSync(new URL("../content/releases/reviewed-vocabulary-artifacts-20261101.json", import.meta.url), "utf8"));
export const publication: Publication = JSON.parse(readFileSync(new URL("../content/releases/reviewed-vocabulary-publication-20261101.json", import.meta.url), "utf8"));
const products = ["level-6", "progression-4-6", "advanced-7-9", "complete-1-9"];
const sha = (bytes: string | Uint8Array) => createHash("sha256").update(bytes).digest("hex");

// This validates recorded dashboard publication evidence; it makes no remote requests
// and does not claim that every uploaded object has been downloaded again.
export function validatePublication(release: ApprovedRelease, receipt: Publication, versionFor = generationVersionForProduct) {
  if (release.schemaVersion !== 1 || receipt.schemaVersion !== 1 || receipt.bucket !== "hskkit-commercial-exports" || receipt.prefix !== "system/artifacts/") throw Error("PUBLICATION_SCOPE_MISMATCH");
  if (sha(JSON.stringify(release)) !== receipt.artifactManifestSha256) throw Error("PUBLICATION_ARTIFACT_MANIFEST_MISMATCH");
  const required = products.flatMap(productId => buildProductDeliveries(productId).flatMap(delivery => [
    `${productId}/${versionFor(productId)}/${delivery.deliveryKey}.${delivery.format}`,
    `${productId}/${versionFor(productId)}/${delivery.deliveryKey}.manifest.json`,
  ])).sort();
  const actual = release.files.map(file => `${file.productId}/${file.generationVersion}/${file.file}`).sort();
  if (JSON.stringify(actual) !== JSON.stringify(required) || release.files.some(file => !/^[a-f0-9]{64}$/.test(file.sha256))) throw Error("PUBLICATION_DELIVERY_SET_MISMATCH");
  const covered: string[] = [];
  for (const batch of receipt.batches) {
    if (batch.observedResult !== "all-files-uploaded-successfully" || batch.productIds.some(id => !products.includes(id) || batch.generationVersion !== versionFor(id))) throw Error("PUBLICATION_BATCH_VERSION_MISMATCH");
    const count = release.files.filter(file => batch.productIds.includes(file.productId)).length;
    if (count !== batch.uploadedFileCount || count === 0) throw Error("PUBLICATION_BATCH_COUNT_MISMATCH");
    covered.push(...batch.productIds);
  }
  if (JSON.stringify(covered.sort()) !== JSON.stringify([...products].sort())) throw Error("PUBLICATION_PRODUCT_COVERAGE_MISMATCH");
  const sample = receipt.readBackSamples.find(file => file.productId === "complete-1-9" && file.file === "bundle-zip.zip");
  if (receipt.readBackScope !== "sampled-complete-bundle-only" || !sample || sample.bytes !== 15523408 || sample.sourceAssetCount !== 11000 || !sample.zipInternalChecksumsVerified || !release.files.some(file => file.productId === sample.productId && file.generationVersion === sample.generationVersion && file.file === sample.file && file.sha256 === sample.sha256)) throw Error("PUBLICATION_READ_BACK_SAMPLE_MISMATCH");
  return { status: "recorded-publication-verified", files: release.files.length, products, readBackScope: receipt.readBackScope };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const result = validatePublication(approvedRelease, publication);
  // Optional read-only verification of the artifacts that already exist locally.
  if (process.argv[2]) for (const file of approvedRelease.files) {
    const bytes = readFileSync(resolve(process.argv[2], file.generationVersion, file.productId, file.file));
    if (sha(bytes) !== file.sha256) throw Error(`LOCAL_ARTIFACT_MISMATCH:${file.productId}/${file.file}`);
  }
  console.log(JSON.stringify(result));
}
