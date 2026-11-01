import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";

const path = "src/lib/commercial/products.ts";
const old = execFileSync("git", ["show", `HEAD^:${path}`], { encoding: "utf8" });
const current = readFileSync(path, "utf8");
const groups = [
  ["HSK123456_VOCABULARY_GENERATION_VERSION", ["level-6", "progression-4-6"]],
  ["HSK123456789_VOCABULARY_GENERATION_VERSION", ["advanced-7-9"]],
  ["HSK123456789_LIBRARY_LAYOUT_GENERATION_VERSION", ["complete-1-9"]],
] as const;
const products: string[] = [];
for (const [symbol, ids] of groups) {
  const pattern = new RegExp(`^export const ${symbol}="([a-z0-9._-]+)";`, "m");
  const before = old.match(pattern)?.[1], after = current.match(pattern)?.[1];
  if (!before || !after) throw Error(`VOCABULARY_VERSION_MISSING:${symbol}`);
  if (before !== after) products.push(...ids);
}
const result = `changed=${products.length > 0}\nproducts=${products.join(",")}\n`;
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, result);
console.log(result);
