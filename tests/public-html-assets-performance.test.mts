import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const modulePath = new URL("../scripts/publish-public-html-assets.mjs", import.meta.url);

const expectedRoutes = ["/", "/dictionary", "/levels", "/pricing", "/reading"];
const forbiddenPrefixes = [
  "/account",
  "/admin",
  "/api",
  "/checkout",
  "/dashboard",
  "/exports",
  "/mistakes",
  "/orders",
  "/review",
  "/saved",
  "/today",
];

test("public HTML asset allowlist is narrow and excludes private surfaces", async () => {
  const { PUBLIC_HTML_ROUTES } = await import(modulePath.href);
  assert.deepEqual([...PUBLIC_HTML_ROUTES].sort(), expectedRoutes);
  for (const route of PUBLIC_HTML_ROUTES) {
    assert.equal(forbiddenPrefixes.some((prefix) => route === prefix || route.startsWith(`${prefix}/`)), false, route);
  }
});

test("publishes byte-identical generated HTML without copying private pages", async () => {
  const { publishPublicHtmlAssets } = await import(modulePath.href);
  const root = await mkdtemp(path.join(os.tmpdir(), "hskkit-public-html-"));
  const nextAppDir = path.join(root, ".next/server/app");
  const assetsDir = path.join(root, ".open-next/assets");
  await mkdir(nextAppDir, { recursive: true });
  await mkdir(assetsDir, { recursive: true });

  for (const route of expectedRoutes) {
    const file = route === "/" ? "index.html" : `${route.slice(1)}.html`;
    await mkdir(path.dirname(path.join(nextAppDir, file)), { recursive: true });
    await writeFile(path.join(nextAppDir, file), `<!doctype html><title>${route}</title>`);
  }
  await writeFile(path.join(nextAppDir, "account.html"), "private account shell");
  await writeFile(path.join(nextAppDir, "today.html"), "private learning shell");

  const result = await publishPublicHtmlAssets({ nextAppDir, assetsDir });
  assert.deepEqual(result.routes, expectedRoutes);
  assert.equal(result.filesCopied, expectedRoutes.length);

  for (const route of expectedRoutes) {
    const file = route === "/" ? "index.html" : `${route.slice(1)}.html`;
    assert.deepEqual(await readFile(path.join(assetsDir, file)), await readFile(path.join(nextAppDir, file)));
  }
  assert.equal((await readdir(assetsDir)).includes("account.html"), false);
  assert.equal((await readdir(assetsDir)).includes("today.html"), false);
});

test("fails closed when a required public HTML artifact is missing", async () => {
  const { publishPublicHtmlAssets } = await import(modulePath.href);
  const root = await mkdtemp(path.join(os.tmpdir(), "hskkit-public-html-missing-"));
  await mkdir(path.join(root, ".next/server/app"), { recursive: true });
  await mkdir(path.join(root, ".open-next/assets"), { recursive: true });
  await assert.rejects(
    publishPublicHtmlAssets({
      nextAppDir: path.join(root, ".next/server/app"),
      assetsDir: path.join(root, ".open-next/assets"),
    }),
    /Missing required public HTML artifact/,
  );
});

test("deployment commands publish the public HTML assets after the OpenNext build", async () => {
  const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  for (const name of ["preview", "deploy", "upload"]) {
    const command = packageJson.scripts[name];
    assert.match(command, /opennextjs-cloudflare build/);
    assert.match(command, /publish-public-html-assets\.mjs/);
    assert.ok(command.indexOf("opennextjs-cloudflare build") < command.indexOf("publish-public-html-assets.mjs"));
  }
});
