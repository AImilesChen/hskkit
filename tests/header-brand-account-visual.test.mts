import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const header = fs.readFileSync(new URL("../src/app/site-header.tsx", import.meta.url), "utf8");

test("header uses the approved compact HSKKit brand mark and split wordmark", () => {
  assert.match(header, /h-\[40px\] w-\[40px\]/);
  assert.match(header, /rounded-\[10px\]/);
  assert.match(header, /text-\[23px\]/);
  assert.match(header, /font-extrabold/);
  assert.match(header, /Noto Sans SC/);
  assert.match(header, /brand-page-accent/);
  assert.match(header, /text-\[20px\]/);
  assert.match(header, />HSK<\/span>/);
  assert.match(header, /text-blue-600">Kit<\/span>/);
});

test("desktop Sign in is an account button rather than an active navigation underline", () => {
  assert.match(header, /entry\.href === "\/account"/);
  assert.match(header, /h-\[40px\] min-h-\[40px\]/);
  assert.match(header, /rounded-lg border border-blue-200/);
  assert.match(header, /bg-white px-4/);
  assert.match(header, /hover:border-blue-300 hover:bg-blue-50/);
  assert.match(header, /focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/);
});

test("mobile keeps the same Sign in destination with a distinct full-width account action", () => {
  assert.match(header, /border-blue-200 bg-blue-50/);
  assert.match(header, /text-blue-700/);
  assert.match(header, /min-h-12/);
});
