import { readFileSync } from "node:fs";

import { validateRepository, type ContentRepository } from "../../src/lib/content/repository.ts";

const repositoryPath = process.argv[2];
if (!repositoryPath) {
  console.error("Usage: validate-content.mts <repository.json>");
  process.exit(2);
}

try {
  const repository = JSON.parse(readFileSync(repositoryPath, "utf8")) as ContentRepository;
  validateRepository(repository);
  console.log(JSON.stringify({ status: "valid", repository: repositoryPath }));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
