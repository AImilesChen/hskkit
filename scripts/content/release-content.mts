import { readFileSync } from "node:fs";

import {
  publishRelease,
  rollbackRelease,
  withdrawRelease,
  type ContentRepository,
} from "../../src/lib/content/repository.ts";
import { writeJsonAtomicallyNew } from "./write-json.mts";

const [action, repositoryPath, releaseId, outputPath, timestamp = new Date().toISOString()] = process.argv.slice(2);
if (!action || !repositoryPath || !releaseId || !outputPath) {
  console.error("Usage: release-content.mts <publish|withdraw|rollback> <repository.json> <release-id> <output.json> [ISO timestamp]");
  process.exit(2);
}

try {
  const repository = JSON.parse(readFileSync(repositoryPath, "utf8")) as ContentRepository;
  const next = action === "publish"
    ? publishRelease(repository, releaseId, timestamp)
    : action === "withdraw"
      ? withdrawRelease(repository, releaseId, timestamp)
      : action === "rollback"
        ? rollbackRelease(repository, releaseId, timestamp)
        : (() => { throw new Error(`Unknown release action: ${action}`); })();
  writeJsonAtomicallyNew(outputPath, next, [repositoryPath]);
  console.log(JSON.stringify({ status: action, releaseId, output: outputPath }));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
