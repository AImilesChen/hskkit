import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const catalog = JSON.parse(readFileSync(resolve(root, "src/lib/content/catalog.json"), "utf8"));
const runtime = JSON.parse(readFileSync(resolve(root, "src/lib/content/runtime-content-index.json"), "utf8"));
const activeReleaseId = catalog.activeReleaseByStandard?.hsk3;
const activeRelease = catalog.releases.find((release) => release.id === activeReleaseId && release.status === "published");
if (!activeRelease) throw new Error("No active published HSK 3.0 release");

const releasedContentIds = new Set(activeRelease.contentAssetIds);
const releasedAudioIds = new Set(activeRelease.audioAssetIds);
const contentById = new Map(catalog.contentAssets.map((asset) => [asset.id, asset]));
const runtimeAudioById = new Map(runtime.publishedAudioAssets.map((asset) => [asset.id, asset]));
const formalAudio = catalog.audioAssets.filter((asset) =>
  releasedAudioIds.has(asset.id)
  && asset.qaStatus === "approved"
);

const failures = [];
const seenContentIds = new Set();
const seenStorageKeys = new Set();
const countsByLevel = {};
const countsByKind = {};
let totalBytes = 0;
let totalDuration = 0;

for (const asset of formalAudio) {
  const content = contentById.get(asset.contentAssetId);
  if (!content) failures.push(`${asset.id}: missing content asset`);
  else {
    if (!releasedContentIds.has(content.id) || content.publish_status !== "published" || content.qa_status !== "approved") {
      failures.push(`${asset.id}: content asset is not published and QA-approved`);
    }
    if (content.level !== asset.level) failures.push(`${asset.id}: audio/content level mismatch`);
  }
  if (!runtimeAudioById.has(asset.id)) failures.push(`${asset.id}: absent from runtime published index`);
  if (seenContentIds.has(asset.contentAssetId)) failures.push(`${asset.id}: duplicate audio for content ${asset.contentAssetId}`);
  if (seenStorageKeys.has(asset.storageKey)) failures.push(`${asset.id}: duplicate storage key ${asset.storageKey}`);
  seenContentIds.add(asset.contentAssetId);
  seenStorageKeys.add(asset.storageKey);

  if (!/^audio\/formal\/[a-z0-9/_-]+\.mp3$/.test(asset.storageKey)) {
    failures.push(`${asset.id}: invalid formal audio storage key`);
    continue;
  }
  const path = resolve(root, "public", asset.storageKey);
  let bytes;
  try {
    bytes = statSync(path).size;
  } catch {
    failures.push(`${asset.id}: missing file ${asset.storageKey}`);
    continue;
  }
  if (bytes <= 0) failures.push(`${asset.id}: empty file`);
  totalBytes += bytes;
  const checksum = createHash("sha256").update(readFileSync(path)).digest("hex");
  if (checksum !== asset.checksumSha256) failures.push(`${asset.id}: checksum mismatch`);

  const probe = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", path], { encoding: "utf8" });
  const duration = Number(probe.stdout.trim());
  if (probe.status !== 0 || !Number.isFinite(duration) || duration < 0.2) failures.push(`${asset.id}: invalid or silent-length audio stream`);
  else totalDuration += duration;

  const decode = spawnSync("ffmpeg", ["-v", "error", "-i", path, "-f", "null", "-"], { encoding: "utf8" });
  if (decode.status !== 0) failures.push(`${asset.id}: decode failed: ${decode.stderr.trim()}`);
  countsByLevel[asset.level] = (countsByLevel[asset.level] ?? 0) + 1;
  countsByKind[asset.audioKind] = (countsByKind[asset.audioKind] ?? 0) + 1;
}

const runtimeFormalAudio = runtime.publishedAudioAssets.filter((asset) => asset.qaStatus === "approved");
if (runtimeFormalAudio.length !== formalAudio.length) failures.push(`runtime/catalog formal-audio count mismatch: ${runtimeFormalAudio.length}/${formalAudio.length}`);

const summary = {
  result: failures.length ? "FAIL" : "PASS",
  activeReleaseId,
  formalAudioAssets: formalAudio.length,
  filesChecked: formalAudio.length,
  checksumsChecked: formalAudio.length,
  filesDecoded: formalAudio.length,
  totalBytes,
  totalDurationSeconds: Number(totalDuration.toFixed(2)),
  countsByLevel,
  countsByKind,
  failures,
};
console.log(JSON.stringify(summary));
if (failures.length) process.exitCode = 1;
