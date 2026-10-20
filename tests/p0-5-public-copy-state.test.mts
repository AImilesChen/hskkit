import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(`${process.cwd()}/${path}`, "utf8");

const files = {
  publicCopy: "src/lib/public-copy.ts",
  home: "src/app/page.tsx",
  pricing: "src/app/pricing/page.tsx",
  packs: "src/app/store/page.tsx",
  purchase: "src/app/store/store-purchase.tsx",
  productCheckout: "src/app/store/[productId]/resource-product-checkout.tsx",
  contact: "src/app/contact/page.tsx",
  terms: "src/app/terms-of-service/page.tsx",
  reading: "src/app/hsk-1-reading-practice/page.tsx",
  worksheet: "src/app/tools/chinese-character-practice-sheet-generator/page.tsx",
  worksheetTool: "src/app/tools/chinese-character-practice-sheet-generator/worksheet-tool.tsx",
  levels: "src/app/levels/page.tsx",
  vocabulary: "src/app/vocabulary/[level]/page.tsx",
  grammar: "src/app/grammar/page.tsx",
  guide: "src/app/hsk-3-0/page.tsx",
  comparison: "src/app/hsk-2-0-vs-3-0/page.tsx",
  navigation: "src/app/site-navigation.ts",
  mockPage: "src/app/mock/[band]/page.tsx",
  mockExam: "src/app/components/mock-exam.tsx",
  practiceSelector: "src/app/practice/practice-selector-client.tsx",
  practiceClient: "src/app/practice/[level]/[skill]/practice-client.tsx",
  mockDomain: "src/lib/mock/domain.ts",
  todayContent: "src/lib/learning/today-content.ts",
  contentLicense: "src/app/content-license/page.tsx",
  success: "src/app/checkout/success/page.tsx",
  cancel: "src/app/checkout/cancel/page.tsx",
  exports: "src/app/exports/page.tsx",
  legacyLevels: "src/app/hsk-levels/page.tsx",
  legacyLevel6: "src/app/hsk-6-vocabulary/page.tsx",
} as const;
const s = Object.fromEntries(Object.entries(files).map(([key, path]) => [key, read(path)])) as Record<keyof typeof files, string>;

test("public copy keeps one explicit product boundary after the Test-mode Store opens", () => {
  assert.match(s.publicCopy, /11,092[\s\S]*5,456[\s\S]*5,636[\s\S]*unified HSK 7–9 advanced ability band/);
  assert.match(s.publicCopy, /15 separate grammar, reading and sentence items; these are not vocabulary words/);
  assert.match(s.publicCopy, /Guest study is supported/);
  for (const key of ["home", "pricing", "contact", "terms"] as const) {
    assert.match(s[key], /PUBLIC_FORMAL_CONTENT_SCOPE/);
    assert.match(s[key], /PUBLIC_ACCOUNT_SCOPE/);
  }
  assert.match(s.packs, /published, QA-approved, rights-checked content/i);
  assert.match([s.home,s.pricing,s.packs,s.contact,s.terms].join("\n"), /Stripe Test/);
});

test("Test-mode Store submits the frozen product identity", () => {
  assert.match(s.pricing, /From US\$3\.99/);
  assert.match(s.purchase, /href=\{`\/store\/\$\{product\.id\}`\}/);
  assert.match(s.productCheckout, /commercial\/checkout/);
  assert.match(s.productCheckout, /body:JSON\.stringify\(\{productId,idempotencyKey/);
  assert.doesNotMatch(`${s.purchase}\n${s.productCheckout}`, /live payment|sk_live_/i);
});

test("P0-5 removes dictionary and account contradictions", () => {
  assert.doesNotMatch(s.home, /Dictionary and listening[\s\S]*AVAILABLE/);
  assert.match(s.home, /PUBLIC_DICTIONARY_SCOPE/);
  assert.doesNotMatch(s.pricing, /Published vocabulary and dictionary/);
  assert.doesNotMatch(s.reading, /No account or payment is required/);
  assert.match(s.reading, /optional account/i);
});

test("P0-5 uses one HSK 7–9 ability-band label", () => {
  const combined = ["home","levels","vocabulary","grammar","guide","comparison","navigation","mockPage","mockExam","practiceSelector","practiceClient","mockDomain","todayContent","contentLicense"].map((key) => s[key as keyof typeof s]).join("\n");
  assert.match(combined, /unified HSK 7–9 advanced ability band/);
  assert.doesNotMatch(combined, /official advanced band|advanced learning path|advanced-band catalog|unified Levels 7–9 advanced band|Levels 7–9 unified advanced band|Unified 7–9 band|HSK 7–9 ability model|Advanced 7–9 band|unified HSK 7–9 advanced mock/i);
});

test("P0-5 uses approved unopened-feature states", () => {
  const combined = [s.reading, s.worksheet, s.worksheetTool].join("\n");
  assert.doesNotMatch(combined, /future releases?|future updates?|coming soon/i);
  assert.match(combined, /Coming later/);
});

test("P0-5 keeps direct commercial routes in Test-mode context", () => {
  assert.doesNotMatch(s.success, /Payment received/);
  assert.match(s.success, /Stripe Test checkout returned[\s\S]*CheckoutSuccessClient/);
  assert.match(s.cancel, /Stripe Test checkout cancelled[\s\S]*No payment was completed/);
  assert.match(s.exports, /Create private files, follow generation status and use short-lived owner-only download links/);
});

test("P0-5 redirects stale public scope pages", () => {
  assert.match(s.legacyLevels, /permanentRedirect\("\/levels"\)/);
  assert.match(s.legacyLevel6, /permanentRedirect\("\/vocabulary\/6"\)/);
});
