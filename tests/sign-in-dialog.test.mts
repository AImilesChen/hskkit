import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { build } from "esbuild";
import { signInReturnTo } from "../src/lib/account/sign-in.ts";

const built = await build({
  entryPoints: ["src/app/site-header.tsx"], bundle: true, write: false, outdir: "output/sign-in-dialog-test",
  platform: "node", format: "cjs", jsx: "automatic", loader: { ".css": "empty" },
  external: ["react", "react/jsx-runtime"],
  plugins: [{ name: "header-platform", setup(builder) {
    builder.onResolve({ filter: /^(next\/link|next\/navigation|@\/lib\/account\/browser)$/ }, args => ({ path: args.path, namespace: "fixture" }));
    builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ contents: args.path === "next/link"
      ? `import {createElement} from 'react'; export default function Link({children,prefetch,...props}) {return createElement('a',props,children);}`
      : args.path === "next/navigation" ? `export const usePathname=()=>'/dictionary';`
      : `export async function loadAccountSessionSnapshot(){throw Error('Server rendering must not request account data');}`, loader: "js" }));
  } }],
});
const value = { exports: {} as { default: () => unknown } };
new Function("require", "module", "exports", built.outputFiles[0].text)(createRequire(import.meta.url), value, value.exports);

test("header offers a local sign-in dialog and retains a working sign-in page fallback", () => {
  const html = renderToStaticMarkup(createElement(value.exports.default as never));
  const header = html.match(/<header\b[\s\S]*?<\/header>/)?.[0] ?? "";
  assert.match(header, /aria-haspopup="dialog"/);
  assert.match(header, /aria-controls="site-sign-in-dialog"/);
  assert.doesNotMatch(header, /\/api\/v1\/auth\/google\/start/);
  const fallback = header.match(/href="(\/login\?returnTo=[^"]+)"/)?.[1];
  assert.ok(fallback);
  assert.equal(signInReturnTo(new URL(fallback, "https://hskkit.test").searchParams.get("returnTo")), "/dictionary");
  const dialog = html.match(/<dialog\b[\s\S]*?<\/dialog>/)?.[0] ?? "";
  assert.match(dialog, /aria-labelledby="site-sign-in-title"/);
  assert.doesNotMatch(dialog.match(/^<dialog[^>]*>/)?.[0] ?? "", /\bopen(?:=|\s|>)/);
  assert.match(dialog, /Continue with Google/);
  assert.match(dialog, /Close sign-in/);
  assert.match(dialog, /Keep browsing/);
  assert.doesNotMatch(dialog, /Facebook|Sign up with email|password/i);
  const google = dialog.match(/href="(\/api\/v1\/auth\/google\/start\?[^\"]+)"/)?.[1];
  assert.ok(google);
  assert.equal(signInReturnTo(new URL(google, "https://hskkit.test").searchParams.get("returnTo")), "/dictionary");
});
