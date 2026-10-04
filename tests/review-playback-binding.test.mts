import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("review obtains a ticket before starting media and waits for server confirmation before answer unlock", async () => {
  const dashboard = await readFile(new URL("src/app/components/learning-dashboard.tsx", root), "utf8");
  const control = await readFile(new URL("src/app/components/audio-playback-control.tsx", root), "utf8");
  assert.match(dashboard, /beforePlay=\{\(\) => startFormalPlayback\(activeCard\)\}/);
  assert.match(control, /const allowed = await beforePlay\?\.\(\);[\s\S]*?await audio\.play\(\)/);
  assert.match(dashboard, /await active\.coordinator\.finish\(\)/);
  assert.match(dashboard, /post\("audio_review_ready"/);
  assert.match(dashboard, /disabled=\{[^\n]*!activeCard\.playbackReady/);
  assert.doesNotMatch(dashboard, /onPlay=\{\(\) => void startFormalPlayback/);
});

test("review state resets on card change and failures do not unlock a stale card", async () => {
  const dashboard = await readFile(new URL("src/app/components/learning-dashboard.tsx", root), "utf8");
  assert.match(dashboard, /reviewPlayback\.current\?\.coordinator\.reset\(\)/);
  assert.match(dashboard, /\[currentReviewCardId, currentReviewCardRevision, reviewIds\]/);
  assert.match(dashboard, /key=\{`\$\{activeCard\.id\}:\$\{activeCard\.revision\}:\$\{activeCard\.audioSrc\}`\}/);
  assert.match(dashboard, /active\.cardKey !== `\$\{card\.id\}:\$\{card\.revision\}`/);
  assert.match(dashboard, /playbackVerificationMessage\(code, "complete"\)/);
});
