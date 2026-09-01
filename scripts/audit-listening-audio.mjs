#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const bank = JSON.parse(readFileSync(resolve(root, "src/lib/learning/listening-library.json"), "utf8"));
const manifest = JSON.parse(readFileSync(resolve(root, "src/lib/learning/listening-library-audio.json"), "utf8"));
const runtime = JSON.parse(readFileSync(resolve(root, "src/lib/content/runtime-content-index.json"), "utf8"));
const sourceRelease = JSON.parse(readFileSync(resolve(root, `content/releases/${runtime.releaseId}.json`), "utf8"));
const write = process.argv.includes("--write");

const failures = [];
const warnings = [];
const rows = [];
const groupById = new Map(bank.groups.map((group) => [group.id, group]));
const assetById = new Map(manifest.assets.map((asset) => [asset.id, asset]));
const runtimeIds = new Set([
  ...runtime.dictionaryAssets.map((asset) => asset.id),
  ...Object.values(runtime.runtimeWords).flat().map((asset) => asset.id),
  ...sourceRelease.entries.map((asset) => asset.id),
]);

const fail = (id, check, detail) => failures.push({ id, check, detail });
const sha256 = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");

if (bank.groups.length !== 272) fail("inventory", "bank-count", String(bank.groups.length));
if (manifest.assets.length !== 272) fail("inventory", "manifest-count", String(manifest.assets.length));
if (groupById.size !== bank.groups.length) fail("inventory", "duplicate-bank-id", `${bank.groups.length - groupById.size}`);
if (assetById.size !== manifest.assets.length) fail("inventory", "duplicate-manifest-id", `${manifest.assets.length - assetById.size}`);
const listeningDirectory = resolve(root, "public/audio/listening-library");
const manifestStorageKeys = new Set(manifest.assets.map((asset) => asset.storageKey));
const filesystemStorageKeys = new Set(readdirSync(listeningDirectory, { withFileTypes: true })
  .filter((entry) => entry.isFile())
  .map((entry) => `audio/listening-library/${entry.name}`));
for (const storageKey of filesystemStorageKeys) if (!manifestStorageKeys.has(storageKey)) fail(storageKey, "manifest-entry", "unmanifested filesystem file");
for (const storageKey of manifestStorageKeys) if (!filesystemStorageKeys.has(storageKey)) fail(storageKey, "filesystem-entry", "missing");

for (const group of bank.groups) {
  const asset = assetById.get(group.id);
  if (!asset) {
    fail(group.id, "manifest-entry", "missing");
    continue;
  }
  const path = resolve(root, "public", asset.storageKey);
  const expectedSrc = `/${asset.storageKey}`;
  const sourceAssetId = group.sourceRef.split(":").slice(1).join(":");
  if (asset.text !== group.voiceText) fail(group.id, "text-equality", `${JSON.stringify(asset.text)} != ${JSON.stringify(group.voiceText)}`);
  if (group.audioSrc !== expectedSrc) fail(group.id, "url-parity", `${group.audioSrc} != ${expectedSrc}`);
  if (!runtimeIds.has(sourceAssetId)) fail(group.id, "source-ref", sourceAssetId || "missing");
  if (!group.sourceLicense) fail(group.id, "text-license", "missing");
  if (group.authorizationStatus !== "authorized") fail(group.id, "bank-authorization", String(group.authorizationStatus));
  if (group.qaStatus !== "approved" || group.lifecycleStatus !== "published") fail(group.id, "bank-lifecycle", `${group.qaStatus}/${group.lifecycleStatus}`);
  if (asset.authorization?.status !== "authorized" || !asset.authorization?.license || !asset.authorization?.evidenceUrl?.startsWith("https://")) {
    fail(group.id, "audio-authorization", JSON.stringify(asset.authorization));
  }
  if (asset.contentQaStatus !== "approved" || asset.technicalQaStatus !== "approved" || asset.lifecycleStatus !== "published") {
    fail(group.id, "audio-lifecycle", `${asset.contentQaStatus}/${asset.technicalQaStatus}/${asset.lifecycleStatus}`);
  }
  if (!/XiaoxiaoNeural/.test(asset.voice || "")) fail(group.id, "synthesized-voice", String(asset.voice));

  let bytes = 0;
  let checksum = "";
  try {
    bytes = readFileSync(path).byteLength;
    checksum = sha256(path);
  } catch (error) {
    fail(group.id, "file", error instanceof Error ? error.message : String(error));
    continue;
  }
  if (bytes <= 0) fail(group.id, "non-empty", String(bytes));
  if (checksum !== asset.checksumSha256) fail(group.id, "checksum", `${checksum} != ${asset.checksumSha256}`);

  const probe = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration:stream=codec_name,sample_rate,channels,bit_rate", "-of", "json", path], { encoding: "utf8" });
  if (probe.status !== 0) {
    fail(group.id, "ffprobe", probe.stderr.trim() || `exit ${probe.status}`);
    continue;
  }
  const parsed = JSON.parse(probe.stdout);
  const stream = parsed.streams?.[0] ?? {};
  const duration = Number(parsed.format?.duration);
  if (stream.codec_name !== "mp3") fail(group.id, "codec", String(stream.codec_name));
  if (Number(stream.sample_rate) !== 24000) fail(group.id, "sample-rate", String(stream.sample_rate));
  if (Number(stream.channels) !== 1) fail(group.id, "channels", String(stream.channels));
  if (!Number.isFinite(duration) || duration <= 0.5 || duration > 30) fail(group.id, "duration-range", String(duration));
  if (Math.abs(duration - Number(asset.durationSeconds)) > 0.051) fail(group.id, "duration-metadata", `${duration} != ${asset.durationSeconds}`);

  const decode = spawnSync("ffmpeg", ["-v", "error", "-i", path, "-f", "null", "-"], { encoding: "utf8" });
  if (decode.status !== 0 || decode.stderr.trim()) fail(group.id, "decode", decode.stderr.trim() || `exit ${decode.status}`);

  rows.push({ id: group.id, level: group.level, bytes, duration, codec: stream.codec_name, sampleRate: Number(stream.sample_rate), channels: Number(stream.channels), bitRate: Number(stream.bit_rate || 0), sourceRef: group.sourceRef, textLicense: group.sourceLicense, audioLicense: asset.authorization.license, voice: asset.voice });
}

for (const asset of manifest.assets) if (!groupById.has(asset.id)) fail(asset.id, "question-bank-entry", "missing");

const levels = Object.fromEntries([...new Set(rows.map((row) => row.level))].sort((a, b) => a - b).map((level) => [level, rows.filter((row) => row.level === level).length]));
const durations = rows.map((row) => row.duration);
const summary = {
  auditedAt: new Date().toISOString(),
  bankVersion: bank.version,
  manifestVersion: manifest.version,
  expectedAssets: 272,
  bankAssets: bank.groups.length,
  manifestAssets: manifest.assets.length,
  filesAudited: rows.length,
  levels,
  totalDurationSeconds: Number(durations.reduce((sum, value) => sum + value, 0).toFixed(3)),
  minDurationSeconds: durations.length ? Math.min(...durations) : null,
  maxDurationSeconds: durations.length ? Math.max(...durations) : null,
  sourceType: "synthesized",
  provider: "Microsoft Azure AI Speech",
  voice: "zh-CN-XiaoxiaoNeural",
  automatedResult: failures.length ? "FAIL" : "PASS",
  failureCount: failures.length,
  warningCount: warnings.length,
  limitations: [
    "Automated checks verify inventory, metadata, text parity, checksums, decodeability and technical bounds; they do not prove pronunciation naturalness.",
    "The authorization evidence URL is an HSKKit publisher declaration, not independent legal advice or provider-side entitlement evidence.",
    "No per-asset named human pronunciation reviewer is recorded, so these assets must remain labelled synthesized audio rather than native-speaker or formal recordings.",
  ],
};

const report = { summary, failures, warnings, rows };
const markdown = `# Listening Library audio audit — 2026-09-01\n\n## Result\n\n- Automated result: **${summary.automatedResult}**\n- Question-bank groups: **${summary.bankAssets}**\n- Manifest assets: **${summary.manifestAssets}**\n- Files decoded and checked: **${summary.filesAudited}**\n- HSK level distribution: ${Object.entries(levels).map(([level, count]) => `HSK ${level}: ${count}`).join(", ")}\n- Duration range: ${summary.minDurationSeconds}–${summary.maxDurationSeconds} seconds\n- Total duration: ${summary.totalDurationSeconds} seconds\n- Source type: **Synthesized**\n- Provider / voice: **${summary.provider} / ${summary.voice}**\n- Failure count: **${summary.failureCount}**\n\n## Source and text\n\nEvery bank item was checked against its manifest entry, exact spoken-text field, source reference, source text-license declaration, storage URL, and active runtime content ID. The scripts are HSKKit-curated derivatives referenced to the frozen content release; the files are Microsoft neural-voice synthesis, not human recordings.\n\n## Authorization\n\nEvery item declares an authorized streaming status and points to the HSKKit content-license page. This verifies internal metadata consistency only. The evidence is a publisher declaration, not an independent legal opinion or provider-side entitlement archive. No audit result may describe these files as native-speaker recordings.\n\n## Technical and quality checks\n\nEach file was SHA-256 checked, probed, fully decoded with FFmpeg, matched to the recorded duration, and required to be mono 24 kHz MP3 with a non-empty, bounded duration. These automated checks passed only when the result above is PASS.\n\n## Limitations and required presentation\n\n- Automated inspection does not prove pronunciation naturalness, prosody, or pedagogical appropriateness.\n- The manifests do not identify a named human pronunciation reviewer per asset.\n- User-facing labels must therefore say **Synthesized listening audio** or **Synthesized pronunciation**, never **Formal audio** or **Native-speaker recording**.\n- A later human-audio phase must add reviewer evidence and verified human provenance before changing that label.\n\n## Reproduction\n\nRun: \`node scripts/audit-listening-audio.mjs --write\`\n\nMachine-readable details: \`docs/content/listening-audio-audit-20260901.json\`.\n`;

if (write) {
  writeFileSync(resolve(root, "docs/content/listening-audio-audit-20260901.json"), `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(resolve(root, "docs/content/listening-audio-audit-20260901.md"), markdown);
}

console.log(JSON.stringify(summary));
if (failures.length) {
  console.error(JSON.stringify(failures.slice(0, 20), null, 2));
  process.exit(1);
}
