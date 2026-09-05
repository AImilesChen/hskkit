import { readFile, writeFile } from "node:fs/promises";

const workerPath = new URL("../.open-next/worker.js", import.meta.url);
const marker = "/* hskkit-feedback-email-runtime */";
const injection = `${marker}\nimport { EmailMessage as HskkitEmailMessage } from "cloudflare:email";\nglobalThis.__hskkitEmailMessage = HskkitEmailMessage;\n`;
const handlerPath = new URL("../.open-next/server-functions/default/handler.mjs", import.meta.url);
const middlewareManifestLookup = "getMiddlewareManifest(){return this.minimalMode?null:require(this.middlewareManifestPath)}";
const middlewareManifestDisabled = "getMiddlewareManifest(){return null}";

const source = await readFile(workerPath, "utf8");
if (!source.includes(marker)) {
  if (!source.includes("export default")) {
    throw new Error("Unexpected OpenNext worker output: default export not found.");
  }
  await writeFile(workerPath, `${injection}${source}`);
}

const handler = await readFile(handlerPath, "utf8");
if (handler.includes(middlewareManifestLookup)) {
  await writeFile(handlerPath, handler.replaceAll(middlewareManifestLookup, middlewareManifestDisabled));
} else if (!handler.includes(middlewareManifestDisabled)) {
  throw new Error("Unexpected OpenNext server output: middleware manifest lookup not found.");
}
