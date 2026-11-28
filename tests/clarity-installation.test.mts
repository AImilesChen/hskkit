import assert from "node:assert/strict";
import test from "node:test";
import { CLARITY_CONSENT_KEY, CLARITY_PROJECT_ID, canRecordPublicPage, startClarity, stopClarity } from "../src/lib/clarity.ts";

test("only public study routes without URL-carried data are eligible for replay", () => {
  for (const path of ["/", "/dictionary", "/levels", "/vocabulary/1", "/word/hsk2025.word.l1.0102.v1", "/blog/chinese-negation-bu-mei", "/tools/chinese-tone-trainer"]) assert.equal(canRecordPublicPage(path), true, path);
  for (const path of ["/admin", "/admin/users", "/account", "/login", "/api/v1/auth/google/callback", "/checkout", "/today", "/mistakes", "/dictionary?q=private", "/?token=secret", "/#sync-key", "/word/private-user-data"]) assert.equal(canRecordPublicPage(path), false, path);
  assert.equal(canRecordPublicPage("https://untrusted.invalid/"), false);
  assert.equal(canRecordPublicPage("http://["), false);
});

test("Clarity uses the existing project, one async tag and a separate non-advertising consent", () => {
  const originals = Object.fromEntries(["window", "document", "localStorage"].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const tags: { src?: string;async?:boolean;dataset:Record<string,string>;onload?:()=>void;setAttribute:(key:string,value:string)=>void }[] = [];
  const fixtureWindow = { location: { href: "https://hskkit.com/" }, clarity: undefined as undefined | ((...args:unknown[])=>void) & {q?:unknown[][]} };
  const store = new Map<string,string>([[CLARITY_CONSENT_KEY, "accepted"]]);
  Object.defineProperty(globalThis, "window", {configurable:true,value:fixtureWindow});
  Object.defineProperty(globalThis, "localStorage", {configurable:true,value:{ getItem:(key:string)=>store.get(key)||null }});
  Object.defineProperty(globalThis, "document", {configurable:true,value:{ querySelector:()=>tags[0] || null, createElement:()=>({dataset:{},setAttribute(){}}), head:{appendChild:(tag:typeof tags[number])=>tags.push(tag)} }});
  try {
    startClarity(); startClarity();
    assert.equal(tags.length, 1);
    assert.equal(tags[0].src, `https://www.clarity.ms/tag/${CLARITY_PROJECT_ID}`);
    assert.equal(tags[0].async, true);
    assert.ok(fixtureWindow.clarity?.q?.every(args => args[0] === "consentv2" && (args[1] as Record<string,string>).ad_Storage === "denied"));
    // A late script completion must stop if navigation entered a private route.
    fixtureWindow.location.href = "https://hskkit.com/admin";
    tags[0].onload?.();
    assert.deepEqual(fixtureWindow.clarity?.q?.slice(-2), [["consentv2",{analytics_Storage:"denied",ad_Storage:"denied"}],["stop"]]);
    startClarity(); assert.equal(tags.length, 1);
    fixtureWindow.location.href = "https://hskkit.com/dictionary";
    store.delete(CLARITY_CONSENT_KEY);
    tags[0].onload?.();
    stopClarity();
    assert.equal(fixtureWindow.clarity?.q?.at(-1)?.[0], "stop");
    assert.doesNotMatch(JSON.stringify(fixtureWindow.clarity?.q), /identify|fixture-secret/);
  } finally {
    for (const key of Object.keys(originals)) {
      const descriptor = originals[key];
      if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key);
    }
  }
});
