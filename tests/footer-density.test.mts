import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path: string) => readFile(path, "utf8");

test("footer uses the approved compact 1060px three-column desktop grid", async () => {
  const footer = await read("src/app/site-footer.tsx");

  assert.match(footer, /footer-density-shell[^\"]*sm:pt-\[64px\][^\"]*pb-\[32px\]/);
  assert.match(footer, /footer-density-container[^\"]*max-w-\[1060px\][^\"]*px-\[20px\][^\"]*sm:px-\[32px\]/);
  assert.match(footer, /footer-density-main[^\"]*lg:grid-cols-\[320px_320px_180px\][^\"]*lg:gap-x-\[64px\][^\"]*pb-\[48px\]/);
});

test("footer navigation groups use compact approved link rhythm", async () => {
  const footer = await read("src/app/site-footer.tsx");

  assert.match(footer, /footer-study-links[^\"]*grid-cols-\[repeat\(2,130px\)\][^\"]*gap-x-\[32px\][^\"]*gap-y-\[14px\]/);
  assert.match(footer, /footer-standards-links[^\"]*gap-y-\[14px\]/);
  assert.match(footer, /footer-group-heading[^\"]*mb-\[24px\][^\"]*text-\[13px\][^\"]*leading-\[16px\][^\"]*tracking-\[0\.06em\]/);
  assert.match(footer, /footer-nav-link[^\"]*text-sm[^\"]*leading-5/);
});

test("footer legal row and copyright use the approved compact spacing", async () => {
  const footer = await read("src/app/site-footer.tsx");

  assert.match(footer, /footer-legal-links[^\"]*mt-\[28px\][^\"]*gap-x-\[28px\][^\"]*gap-y-\[10px\]/);
  assert.match(footer, /footer-copyright[^\"]*mt-\[24px\][^\"]*text-\[13px\][^\"]*leading-\[18px\]/);
  assert.match(footer, /Privacy Policy/);
  assert.match(footer, /Terms of Service/);
  assert.match(footer, /Refund Policy/);
  assert.match(footer, /Disclaimer/);
  assert.match(footer, /Contact/);
});

test("footer keeps mobile links touch-safe while allowing compact desktop rows", async () => {
  const footer = await read("src/app/site-footer.tsx");

  assert.match(footer, /footer-nav-link[^\"]*min-h-11[^\"]*lg:min-h-\[20px\]/);
  assert.match(footer, /footer-legal-link[^\"]*min-h-11/);
});
