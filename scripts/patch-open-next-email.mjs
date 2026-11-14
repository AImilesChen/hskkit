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

const costMarker = "/* hskkit-stateless-account-runtime */";
const costSource = await readFile(workerPath, "utf8");
if (!costSource.includes(costMarker)) {
  const anchor = "const url = new URL(request.url);";
  if (!costSource.includes(anchor)) throw new Error("Unexpected Worker template: account fast-path insertion point missing.");
  const prelude = `${costMarker}\nimport { anonymousAccountResponse } from "../src/lib/runtime/anonymous-account.ts";\n`;
  await writeFile(workerPath, prelude + costSource.replace(anchor, `const anonymousResponse = anonymousAccountResponse(request);\n            if (anonymousResponse) return anonymousResponse;\n            ${anchor}`));
}

const handler = await readFile(handlerPath, "utf8");
if (handler.includes(middlewareManifestLookup)) {
  await writeFile(handlerPath, handler.replaceAll(middlewareManifestLookup, middlewareManifestDisabled));
} else if (!handler.includes(middlewareManifestDisabled)
  && !/getMiddlewareManifest\(\)\s*\{\s*return null;?\s*\}/.test(handler)) {
  throw new Error("Unexpected OpenNext server output: middleware manifest lookup not found.");
}

// Reuse the generated NotFound component and current JS/CSS references verbatim.
// Keep this outside the full Next handler so invalid document requests stay cheap.
const wordMarker = "/* hskkit-word-not-found-runtime */";
const wordSource = await readFile(workerPath, "utf8");
const notFoundHtml = await readFile(new URL("../.next/server/app/_not-found.html", import.meta.url), "utf8");
if (!notFoundHtml.includes("Study item not found")) throw new Error("Missing built 404 template");
await writeFile(new URL("../.open-next/word-not-found-html.mjs", import.meta.url), `export default ${JSON.stringify(notFoundHtml)};\n`);
if (!wordSource.includes(wordMarker)) {
  const anchor = 'const { handler } = await import("./server-functions/default/handler.mjs");';
  if (!wordSource.includes(anchor)) throw new Error("Unexpected Worker template: Next import missing");
  const prelude = `${wordMarker}\nimport { missingWordResponse } from "../src/lib/runtime/word-not-found.ts";\nimport wordNotFoundHtml from "./word-not-found-html.mjs";\n`;
  await writeFile(workerPath, prelude + wordSource.replace(anchor, `const missingWord = missingWordResponse(request, wordNotFoundHtml);\n            if (missingWord) return missingWord;\n            ${anchor}`));
}
