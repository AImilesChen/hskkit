#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const ref = process.env.ROLLBACK_GIT_REF;
if (process.env.ROLLBACK_CONFIRM !== "legacy-placement" || !ref) {
  throw new Error("Refusing rollback. Set ROLLBACK_CONFIRM=legacy-placement and ROLLBACK_GIT_REF=<verified rollback tag or commit>.");
}
const run = (command, args, cwd = root) => execFileSync(command, args, { cwd, stdio: "inherit", env: process.env });
run("git", ["rev-parse", "--verify", `${ref}^{commit}`]);
const worktree = mkdtempSync(join(tmpdir(), "hskkit-placement-rollback-"));
let added = false;
try {
  run("git", ["worktree", "add", "--detach", worktree, ref]);
  added = true;
  symlinkSync(resolve(root, "node_modules"), resolve(worktree, "node_modules"), "dir");
  const configPath = resolve(worktree, "wrangler.jsonc");
  const config = readFileSync(configPath, "utf8");
  if (!/"PLACEMENT_DB_MODE"\s*:\s*"(?:primary|shadow|legacy)"/.test(config)) throw new Error("PLACEMENT_DB_MODE not found in rollback ref");
  writeFileSync(configPath, config.replace(/"PLACEMENT_DB_MODE"\s*:\s*"(?:primary|shadow|legacy)"/, '"PLACEMENT_DB_MODE": "legacy"'));
  run("npm", ["run", "deploy"], worktree);
  const response = await fetch(`https://hskkit.com/placement?rollback=${Date.now()}`, { redirect: "manual" });
  if (response.status < 200 || response.status >= 400) throw new Error(`Rollback smoke check failed with HTTP ${response.status}`);
  console.log(JSON.stringify({ rollback: "GO", ref, placementMode: "legacy", smokeStatus: response.status, note: "Submitted checkpoints are continuously projected to legacy; post-cutover in-progress sessions may need restart." }, null, 2));
} finally {
  if (added) {
    try { run("git", ["worktree", "remove", "--force", worktree]); } catch {}
  }
  rmSync(worktree, { recursive: true, force: true });
}
