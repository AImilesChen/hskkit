import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getPublishedWordBySlug } from "../src/lib/dictionary/runtime-word.ts";

const root = new URL("../", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), "utf8");

test("full-catalog word details expose published audio metadata instead of hiding valid files", async () => {
  const withAudio = await getPublishedWordBySlug("hsk3.word.l2.0170.v1");
  assert.equal(withAudio.status, "published");
  if (withAudio.status !== "published") return;
  assert.equal(withAudio.item.hanzi, "服务");
  assert.equal(withAudio.item.audio.status, "formal");
  assert.equal(withAudio.item.audioAsset?.sourceLabel, "Synthesized pronunciation");
  assert.match(withAudio.item.audioAsset?.src ?? "", /^\/audio\/formal\/.+\.mp3$/);

  const withoutAudio = await getPublishedWordBySlug("hsk3.word.l2.0001.v1");
  assert.equal(withoutAudio.status, "published");
  if (withoutAudio.status !== "published") return;
  assert.equal(withoutAudio.item.hanzi, "啊");
  assert.equal(withoutAudio.item.audio.status, "unavailable");
  assert.equal(withoutAudio.item.audioAsset, undefined);
});

test("word detail keeps pronunciation beside the word and learning actions in an independent rail", () => {
  const page = read("src/app/word/[slug]/page.tsx");
  const actions = read("src/app/components/dictionary-word-actions.tsx");
  const pronunciation = read("src/app/components/dictionary-pronunciation.tsx");

  assert.match(page, /DictionaryPronunciation/);
  assert.match(page, /xl:grid-cols-\[minmax\(0,1fr\)_320px\]/);
  assert.match(page, /xl:sticky xl:top-24/);
  assert.match(page, /studySectionCount >= 3/);
  assert.doesNotMatch(page, /When no approved asset exists/);
  assert.doesNotMatch(actions, /AudioPlaybackControl|Audio unavailable/);
  assert.match(pronunciation, /browser voice preview/i);
  assert.match(pronunciation, /Temporary Mandarin guide/);
  assert.match(pronunciation, /variant="icon"/);
});

test("word metadata does not promise published pronunciation when an asset is unavailable", () => {
  const page = read("src/app/word/[slug]/page.tsx");
  assert.match(page, /const audioDescription = word\.audioAsset/);
  assert.match(page, /use a browser voice preview/);
  assert.doesNotMatch(page, /Hear the pronunciation, save the word/);
});

test("browser voice preview becomes pausable even when a browser delays its start event", () => {
  const audioButton = read("src/app/components/audio-button.tsx");
  assert.match(audioButton, /setPhase\("playing"\);\s*window\.speechSynthesis\.speak\(utterance\)/);
});
