import assert from "node:assert/strict";
import test from "node:test";
import { completeCookieChoice, readCookiePreferences, saveCookiePreferences } from "../src/lib/cookie-consent.ts";
import { CLARITY_CONSENT_KEY, GOOGLE_ANALYTICS_CONSENT_KEY } from "../src/lib/clarity.ts";
import { MEASUREMENT_ID, setGoogleAnalyticsConsent } from "../src/lib/google-analytics.ts";

test("old GA4 consent never grants replay and both old choices remain independent", () => {
  const data = new Map<string,string>();
  const storage = { getItem:(key:string)=>data.get(key)||null, setItem:(key:string,value:string)=>{data.set(key,value);} };
  assert.deepEqual(readCookiePreferences(storage), {ga4:null,clarity:null});
  data.set(GOOGLE_ANALYTICS_CONSENT_KEY, "accepted");
  assert.deepEqual(readCookiePreferences(storage), {ga4:true,clarity:null});
  assert.equal(completeCookieChoice(readCookiePreferences(storage)), false);
  data.set(CLARITY_CONSENT_KEY, "rejected");
  assert.deepEqual(readCookiePreferences(storage), {ga4:true,clarity:false});
  assert.equal(completeCookieChoice(readCookiePreferences(storage)), true);
  for (const preferences of [{ga4:true,clarity:true},{ga4:false,clarity:false},{ga4:false,clarity:true},{ga4:true,clarity:false}]) {
    saveCookiePreferences(storage, preferences);
    assert.deepEqual(readCookiePreferences(storage), preferences);
  }
  data.set(CLARITY_CONSENT_KEY, "invalid");
  assert.equal(readCookiePreferences(storage).clarity, null);
});

test("GA opt-out blocks measurement immediately and clears only GA cookies without reloading", () => {
  const keys = ["window","document","location"];
  const originals = keys.map(key=>Object.getOwnPropertyDescriptor(globalThis,key));
  const tags: Record<string,unknown>[] = [], writes:string[] = [];
  const target:Record<string,unknown> = {};
  const doc = {querySelector:()=>tags[0]||null,createElement:()=>({setAttribute(){}}),head:{appendChild:(tag:Record<string,unknown>)=>tags.push(tag)}};
  Object.defineProperty(doc,"cookie",{get:()=>"_ga=fixture; _ga_ABC=fixture; hskkit_session=private; preferences=keep",set:(value:string)=>writes.push(value)});
  Object.defineProperty(globalThis,"window",{configurable:true,value:target});
  Object.defineProperty(globalThis,"document",{configurable:true,value:doc});
  Object.defineProperty(globalThis,"location",{configurable:true,value:{hostname:"hskkit.com",reload(){throw Error("must not reload");}}});
  try {
    setGoogleAnalyticsConsent(false);
    assert.equal(tags.length,0);
    assert.equal(target[`ga-disable-${MEASUREMENT_ID}`],true);
    assert.ok(writes.length>0);
    assert.ok(writes.every(value=>/^_ga(?:=|_)/.test(value) && value.includes("Max-Age=0")));
    assert.doesNotMatch(writes.join(" "),/hskkit_session|preferences/);
    setGoogleAnalyticsConsent(true);
    assert.equal(tags.length,1);
    assert.equal(target[`ga-disable-${MEASUREMENT_ID}`],false);
    assert.equal(tags[0].src,`https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`);
    const commands = (target.dataLayer as IArguments[]).map(value=>Array.from(value));
    assert.ok(commands.some(value=>value[0]==="config" && value[1]===MEASUREMENT_ID));
    setGoogleAnalyticsConsent(false);
    assert.equal(target[`ga-disable-${MEASUREMENT_ID}`],true);
    setGoogleAnalyticsConsent(true);
    assert.equal(tags.length,1);
  } finally { keys.forEach((key,i)=>{ const descriptor=originals[i]; if(descriptor)Object.defineProperty(globalThis,key,descriptor);else Reflect.deleteProperty(globalThis,key); }); }
});
