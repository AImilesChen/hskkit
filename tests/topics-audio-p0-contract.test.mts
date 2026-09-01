import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), "utf8");

test("P0 freezes the approved Topics and audio boundary", () => {
  const contract = read("docs/content/topics-audio-p0-contract.md");
  assert.match(contract, /does \*\*not\*\* add vocabulary/);
  assert.match(contract, /Formal audio.*prohibited/);
  assert.match(contract, /loading/);
  assert.match(contract, /unavailable/);
  assert.match(contract, /272-item Listening Library audit/);
});

test("one canonical resolver serves content, practice, and Listening assets with truthful synthesized labels", async () => {
  const assets = await import("../src/lib/audio/assets.ts");
  const content = assets.publishedContentAudioAsset("hsk3.word.l1.0228.v1", "买");
  const practice = assets.publishedPracticeAudioAsset("hsk3.practice.audio.level-4-1.v1");
  const listening = assets.publishedListeningAudioAsset("hsk1-001");

  assert.equal(content?.sourceType, "synthesized");
  assert.equal(content?.sourceLabel, "Synthesized pronunciation");
  assert.equal(content?.kind, "word");
  assert.equal(practice?.sourceLabel, "Synthesized listening audio");
  assert.equal(listening?.sourceLabel, "Synthesized listening audio");
  assert.equal(assets.publishedListeningAudioAsset("missing"), undefined);
});

test("all 272 Listening assets resolve through the canonical contract without exposing a false formal label", async () => {
  const manifest = JSON.parse(read("src/lib/learning/listening-library-audio.json"));
  const { publishedListeningAudioAsset, publicAudioAsset } = await import("../src/lib/audio/assets.ts");
  assert.equal(manifest.assets.length, 272);
  for (const source of manifest.assets) {
    const asset = publicAudioAsset(publishedListeningAudioAsset(source.id));
    assert.ok(asset, source.id);
    assert.equal(asset.sourceType, "synthesized");
    assert.equal(asset.sourceLabel, "Synthesized listening audio");
    assert.doesNotMatch(asset.sourceLabel, /formal/i);
    assert.equal("text" in asset, false);
  }
});

test("shared audio control defines loading, ready, playing, error, and unavailable UI", () => {
  const component = read("src/app/components/audio-playback-control.tsx");
  for (const state of ["loading", "ready", "playing", "error", "unavailable"]) {
    assert.match(component, new RegExp(`"${state}"`));
  }
  assert.match(component, /Retry audio/);
  assert.match(component, /Audio unavailable/);
  assert.match(component, /aria-live="polite"/);
  assert.match(component, /setState\("loading"\);[\s\S]*await beforePlay/);
  assert.match(component, /await audio\.play\(\);[\s\S]*setState\("playing"\)/);
  assert.match(component, /onFailure/);
});

test("Topics, Dictionary, practice, and Listening consume canonical assets and accurate labels", () => {
  const topicServer = read("src/lib/topics/server.ts");
  const topicPage = read("src/app/topics/[slug]/page.tsx");
  const topicPractice = read("src/app/topics/[slug]/practice/topic-practice-client.tsx");
  const wordPage = read("src/app/word/[slug]/page.tsx");
  const wordPractice = read("src/app/word/[slug]/practice/word-practice-client.tsx");
  const listening = read("src/lib/learning/listening-library.ts");
  const player = read("src/app/components/step7-exercise.tsx");

  assert.match(topicServer, /publishedContentAudioAsset/);
  assert.match(topicPage, /AudioPlaybackControl/);
  assert.match(wordPage, /audioAsset/);
  assert.match(listening, /publishedListeningAudioAsset/);
  assert.match(player, /audioAsset/);
  assert.match(topicPractice, /onFailure=\{failPlayback\}/);
  assert.match(wordPractice, /onFailure=\{failPlayback\}/);
  for (const source of [topicPage, topicPractice, wordPage, wordPractice, player]) {
    assert.doesNotMatch(source, /Formal audio|formal audio/);
  }
});

test("Listening audit enforces manifest, bank, and filesystem parity", () => {
  const audit = read("scripts/audit-listening-audio.mjs");
  assert.match(audit, /readdirSync\(listeningDirectory/);
  assert.match(audit, /unmanifested filesystem file/);
  assert.match(audit, /filesystem-entry/);
});
