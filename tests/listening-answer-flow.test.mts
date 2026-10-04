import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import audioManifest from "../src/lib/learning/listening-library-audio.json" with { type: "json" };
import { listeningQuestionsForLevel, listeningSession } from "../src/lib/learning/listening-library.ts";

const root = new URL("..", import.meta.url);
const source = (path: string) => readFileSync(new URL(path, root), "utf8");

test("all HSK 1-9 listening questions use the same bounded answer-flow contract", () => {
  const step7 = source("src/app/components/step7-exercise.tsx");
  const page = source("src/app/listen/advanced/[slug]/page.tsx");
  for (let level = 1; level <= 9; level += 1) {
    assert.ok(listeningQuestionsForLevel(level).length > 0, `HSK ${level}`);
  }
  assert.match(page, /previousHref/);
  assert.match(page, /previousLabel/);
  assert.match(step7, /listeningSession && <div className="step7-listening-actions"/);
  assert.match(step7, /Previous question/);
  assert.match(step7, /Check answer/);
  assert.match(step7, /Answer this question first/);
  assert.match(step7, /View session result/);
});

test("multiple-choice listening selection is reversible and saves only from Check answer", () => {
  const step7 = source("src/app/components/step7-exercise.tsx");
  assert.match(step7, /onClick=\{\(\) => setAnswer\(letter\)\}/);
  assert.match(step7, /Object\.entries\(exercise\.options\)\.map\(\(\[letter, text\]\) => listeningSession/);
  assert.match(step7, /onClick=\{\(\) => void persistAnswer\(\)\}/);
  assert.match(step7, /disabled=\{!played \|\| !answered \|\| saving \|\| saved\}/);
  assert.match(step7, /className=\{`btn secondary listening-option \$\{answer === letter \? "selected" : ""\}`\.trim\(\)\}/);
  assert.match(step7, /\(listeningSession \? saved : answered\) && <div className=\{`step7-alert/);
});

test("listening playback exposes progress, verification and replay states without a disappearing control", () => {
  const player = source("src/app/components/audio-playback-control.tsx");
  const step7 = source("src/app/components/step7-exercise.tsx");
  assert.match(player, /showProgress\?: boolean/);
  assert.match(player, /verificationState\?: "idle" \| "verifying" \| "verified"/);
  assert.match(player, /Playback finished — confirming playback…/);
  assert.match(player, /Playback complete/);
  assert.match(player, /Play again/);
  assert.match(player, /role="progressbar"/);
  assert.match(player, /aria-busy=/);
  assert.match(player, /const disabled = unavailable \|\| state === "loading" \|\| verificationState === "verifying"/);
  assert.match(player, /bg-blue-700/);
  assert.match(step7, /Play the audio to unlock the answers\./);
  assert.match(step7, /Keep listening — answers unlock when playback finishes\./);
  assert.match(step7, /Select one answer, then check it\./);
});

test("trusted listening manifest duration drives the server playback gate", () => {
  const assets = source("src/lib/audio/assets.ts");
  const route = source("src/app/api/v1/learning/route.ts");
  const playback = source("src/lib/learning/step7-playback.ts");
  assert.ok(audioManifest.assets.every((asset) => asset.durationSeconds >= 0.5));
  assert.match(assets, /durationSeconds: asset\.durationSeconds/);
  assert.match(route, /lesson\.audioAsset\.durationSeconds/);
  assert.match(playback, /trustedDurationSeconds\?: number/);
  assert.match(playback, /Math\.ceil\(trustedDurationSeconds \* 1_000\)/);
});

test("returning to a submitted listening question restores its answer without another write", () => {
  const step7 = source("src/app/components/step7-exercise.tsx");
  assert.match(step7, /hskkit:listening:answers:/);
  assert.match(step7, /setSaved\(true\)/);
  assert.match(step7, /storedAnswers\[String\(listeningSession\.position\)\]/);
  const session = listeningSession(1, 10, "answer-flow-contract");
  assert.equal(session.questions.length, 10);
});
