export type AccountSnapshotOptions = {
  force?: boolean;
  timeoutMs?: number;
  retryDelaysMs?: readonly number[];
};

type CachedSnapshot = { value: unknown; expiresAt: number };
type RetryableError = Error & { retryable?: boolean };

const snapshotTtlMs = 5_000;
let cachedSnapshot: CachedSnapshot | undefined;
let inFlight: Promise<unknown> | undefined;
let cacheGeneration = 0;

const sleep = (delayMs: number) => new Promise<void>((resolve) => setTimeout(resolve, delayMs));

async function fetchAccountSnapshot(timeoutMs: number): Promise<unknown> {
  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  try {
    const response = await fetch("/api/v1/account", {
      cache: "no-store",
      headers: { "content-type": "application/json" },
      signal: controller.signal,
    });
    const data = await response.json();
    if (!response.ok) {
      const error = new Error(data?.error ?? "ACCOUNT_STATUS_UNAVAILABLE") as RetryableError;
      error.retryable = response.status === 408 || response.status === 429 || response.status >= 500;
      throw error;
    }
    return data;
  } catch (cause) {
    if (timedOut) {
      const error = new Error("ACCOUNT_STATUS_TIMEOUT") as RetryableError;
      error.retryable = true;
      throw error;
    }
    throw cause;
  } finally {
    clearTimeout(timeout);
  }
}

export function clearAccountSnapshot() {
  cacheGeneration += 1;
  cachedSnapshot = undefined;
  inFlight = undefined;
}

export function loadAccountSnapshot<T = unknown>({
  force = false,
  timeoutMs = 8_000,
  retryDelaysMs = [150],
}: AccountSnapshotOptions = {}): Promise<T> {
  const currentTime = Date.now();
  if (!force && cachedSnapshot && cachedSnapshot.expiresAt > currentTime) {
    return Promise.resolve(cachedSnapshot.value as T);
  }
  if (!force && inFlight) return inFlight as Promise<T>;

  const generation = cacheGeneration;
  const request = (async () => {
    for (let attempt = 0; ; attempt += 1) {
      try {
        const value = await fetchAccountSnapshot(timeoutMs);
        if (generation === cacheGeneration) {
          cachedSnapshot = { value, expiresAt: Date.now() + snapshotTtlMs };
        }
        return value as T;
      } catch (cause) {
        const delayMs = retryDelaysMs[attempt];
        if (delayMs === undefined || (cause as RetryableError)?.retryable === false) throw cause;
        await sleep(delayMs);
      }
    }
  })();
  inFlight = request;
  void request.finally(() => {
    if (inFlight === request) inFlight = undefined;
  }).catch(() => undefined);
  return request;
}
