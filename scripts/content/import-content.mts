import { readFileSync } from "node:fs";

import { importBatch, type ContentImportBatch } from "../../src/lib/content/importer.ts";
import { type ContentRepository } from "../../src/lib/content/repository.ts";
import { writeJsonAtomicallyNew } from "./write-json.mts";

const [repositoryPath, batchPath, outputPath] = process.argv.slice(2);
if (!repositoryPath || !batchPath || !outputPath) {
  console.error("Usage: import-content.mts <repository.json> <batch.json> <output.json>");
  process.exit(2);
}

try {
  const repository = JSON.parse(readFileSync(repositoryPath, "utf8")) as ContentRepository;
  const batch = JSON.parse(readFileSync(batchPath, "utf8")) as ContentImportBatch;
  const imported = importBatch(repository, batch);
  writeJsonAtomicallyNew(outputPath, imported, [repositoryPath, batchPath]);
  console.log(JSON.stringify({ status: "imported", releaseId: batch.release.id, output: outputPath }));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
