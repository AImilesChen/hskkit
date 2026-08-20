import { closeSync, existsSync, fsyncSync, linkSync, openSync, unlinkSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";

export function writeJsonAtomicallyNew(
  outputPath: string,
  value: unknown,
  protectedInputPaths: string[],
): void {
  const output = resolve(outputPath);
  const protectedInputs = new Set(protectedInputPaths.map((path) => resolve(path)));
  if (protectedInputs.has(output)) {
    throw new Error("Output path must not be the same as an input path");
  }
  if (existsSync(output)) {
    throw new Error(`Output path already exists: ${outputPath}`);
  }

  const temporary = resolve(dirname(output), `.${basename(output)}.${process.pid}.${randomUUID()}.tmp`);
  let descriptor: number | undefined;
  try {
    descriptor = openSync(temporary, "wx", 0o600);
    writeFileSync(descriptor, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = undefined;
    linkSync(temporary, output);
  } finally {
    if (descriptor !== undefined) closeSync(descriptor);
    if (existsSync(temporary)) unlinkSync(temporary);
  }
}
