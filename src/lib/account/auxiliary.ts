export async function settleInBatches<T>(
  tasks: ReadonlyArray<() => Promise<T>>,
  batchSize: number,
): Promise<Array<PromiseSettledResult<T>>> {
  if (!Number.isInteger(batchSize) || batchSize < 1) throw new Error("INVALID_BATCH_SIZE");
  const results: Array<PromiseSettledResult<T>> = [];
  for (let index = 0; index < tasks.length; index += batchSize) {
    const batch = tasks.slice(index, index + batchSize).map((task) => task());
    results.push(...await Promise.allSettled(batch));
  }
  return results;
}
