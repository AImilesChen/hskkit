import { build } from "esbuild";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const compiled = await build({ entryPoints: ["src/app/admin/(console)/admin-dashboard.tsx"], bundle: true, write: false, platform: "node", format: "cjs", jsx: "automatic", external: ["react", "react/jsx-runtime", "next/link"] });
const moduleValue = { exports: {} as { AdminDashboardView: (props: unknown) => unknown } };
const load = createRequire(import.meta.url);
const scopedRequire = (name: string) => name === "next/link" ? ({ default: ({ children, prefetch: _prefetch, ...props }: { children: unknown; prefetch?: boolean }) => createElement("a", props, children as never), __esModule: true }) : load(name);
new Function("require", "module", "exports", compiled.outputFiles[0].text)(scopedRequire, moduleValue, moduleValue.exports);
const [analytics, operations, page] = await Promise.all([
  fetch("http://127.0.0.1:3047/api/v1/admin/analytics?days=28").then(response => response.json()),
  fetch("http://127.0.0.1:3047/api/v1/admin/overview").then(response => response.json()),
  fetch("http://127.0.0.1:3047/").then(response => response.text()),
]);
const view = renderToStaticMarkup(createElement(moduleValue.exports.AdminDashboardView as never, {
  days: 28, setDays() {}, analytics: { data: analytics, error: null, loading: false }, operations: { data: operations, error: null, loading: false }, refresh() {}, refreshing: false, reload() {}, notice: "",
} as never));
const output = new URL("../../output/admin-dashboard-20261127/", import.meta.url);
await mkdir(output, { recursive: true });
await writeFile(new URL("preview.html", output), page.replace('<div id="root"></div>', `<div id="root">${view}</div>`).replace('<script src="/dashboard.js"></script>', ""));
console.log("Static fixture preview saved. No production data included.");
