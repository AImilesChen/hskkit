import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (path: string) => readFile(new URL(path, root), "utf8");

test("review, dictionary, and topic listening share verified playback orchestration", async () => {
  const [review, dictionary, topic] = await Promise.all([
    source("src/app/components/learning-dashboard.tsx"),
    source("src/app/word/[slug]/practice/word-practice-client.tsx"),
    source("src/app/topics/[slug]/practice/topic-practice-client.tsx"),
  ]);
  assert.match(review, /PlaybackVerificationCoordinator/);
  assert.match(dictionary, /useVerifiedAudioPlayback/);
  assert.match(topic, /useVerifiedAudioPlayback/);
  assert.match(review, /beforePlay=\{\(\) => startFormalPlayback\(activeCard\)\}/);
  assert.match(dictionary, /beforePlay=\{playback\.beforePlay\}/);
  assert.match(topic, /beforePlay=\{playback\.beforePlay\}/);
});

test("all three verified listening UIs lock answers until playback verification succeeds", async () => {
  const [review, dictionary, topic] = await Promise.all([
    source("src/app/components/learning-dashboard.tsx"),
    source("src/app/word/[slug]/practice/word-practice-client.tsx"),
    source("src/app/topics/[slug]/practice/topic-practice-client.tsx"),
  ]);
  assert.match(review, /<fieldset disabled=\{activeCard\.playbackRequired && !activeCard\.playbackReady\}>/);
  assert.match(dictionary, /<fieldset disabled=\{active\.mode === "listening" && !playback\.verified\}/);
  assert.match(topic, /const listeningLocked = question\.mode === "listening" && !playback\.verified/);
});

test("dictionary and topic playback tickets use trusted media duration and expose notBefore", async () => {
  const route = await source("src/app/api/v1/learning/route.ts");
  assert.match(route, /context\.current\.audioAsset\.durationSeconds \?\? publishedAudioDurationBySrc\(context\.current\.audioAsset\.src\)/);
  assert.match(route, /question\.audioAsset\.durationSeconds \?\? publishedAudioDurationBySrc\(question\.audioAsset\.src\)/);
  assert.match(route, /playbackTicket: ticket\.id, notBefore: ticket\.notBefore/);
});

test("playback failures are classified in the client and logged by server action and code", async () => {
  const [route, hook] = await Promise.all([
    source("src/app/api/v1/learning/route.ts"),
    source("src/app/components/use-verified-audio-playback.ts"),
  ]);
  assert.match(route, /\[playback-verification\]/);
  assert.match(route, /reportPlaybackVerificationFailure\(action, code\)/);
  assert.match(hook, /playbackErrorCode\(error\)/);
  assert.match(hook, /playbackVerificationMessage\(code, phase\)/);
});

test("verified audio controls pause and resume without starting a replacement ticket", async () => {
  const control = await source("src/app/components/audio-playback-control.tsx");
  assert.match(control, /if \(state === "playing"\) \{[\s\S]*?audio\.pause\(\);[\s\S]*?return;[\s\S]*?\}/);
  assert.match(control, /const resuming = state === "paused"/);
  assert.match(control, /if \(!resuming\) \{[\s\S]*?beforePlay\?\.\(\)/);
});
