import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), "utf8");

test("topic word cards use the shared compact icon audio variant and keep one dominant CTA", () => {
  const detail = read("src/app/topics/[slug]/page.tsx");

  assert.match(detail, /variant="icon"/);
  assert.match(detail, /label=\{word\.hanzi\}/);
  assert.match(detail, /published synthesized pronunciation/i);
  assert.match(detail, /Learn word/);
  assert.match(detail, /Details →/);
  assert.doesNotMatch(detail, /<AudioPlaybackControl asset=\{word\.audioAsset\} className="mt-[34]" \/>/);
  assert.doesNotMatch(detail, /sm:grid-cols-2[^\n]*grid-cols-2/);
});

test("compact audio control is icon-dominant, truthful, accessible, pausable and retryable", () => {
  const component = read("src/app/components/audio-playback-control.tsx");

  assert.match(component, /variant\?:\s*"default"\s*\|\s*"icon"/);
  assert.match(component, /label\?:\s*string/);
  assert.match(component, /"paused"/);
  assert.match(component, /audio\.pause\(\)/);
  assert.match(component, /"Pause pronunciation"/);
  assert.match(component, /"Retry pronunciation"/);
  assert.match(component, /` for \$\{label\}`/);
  assert.match(component, /asset\.sourceLabel/);
  assert.match(component, /aria-label=\{accessibleActionLabel\}/);
  assert.match(component, /title=\{accessibleActionLabel\}/);
  assert.match(component, /size-11/);
  assert.match(component, /<svg/);
  assert.match(component, /aria-live="polite"/);
});

test("default audio control remains the non-pausable practice-safe presentation", () => {
  const component = read("src/app/components/audio-playback-control.tsx");

  assert.match(component, /variant === "icon" && state === "playing"/);
  assert.match(component, /variant === "default" && state === "error"[\s\S]*audio\.load\(\);[\s\S]*return;/);
  assert.match(component, /const disabled = [^;]*\(variant === "default" && state === "playing"\)/);
});
