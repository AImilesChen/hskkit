export type HeaderAccountStatus = { signedIn: boolean };

export type HeaderAccountStatusOptions = {
  force?: boolean;
  timeoutMs?: number;
  retryDelaysMs?: readonly number[];
};

type CachedStatus = { value: HeaderAccountStatus; expiresAt: number };
type RetryableError = Error & { retryable?: boolean };

const statusTtlMs = 5_000;
let cachedStatus: CachedStatus | undefined;
let inFlight: Promise<HeaderAccountStatus> | undefined;
let cacheGeneration = 0;

const sleep = (delayMs: number) => new Promise<void>((resolve) => setTimeout(resolve, delayMs));

async function fetchHeaderAccountStatus(timeoutMs: number): Promise<HeaderAccountStatus> {
  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch("/api/v1/account/status", {
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
    return { signedIn: data?.signedIn === true };
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

export function clearHeaderAccountStatus() {
  cacheGeneration += 1;
  cachedStatus = undefined;
  inFlight = undefined;
}

export function loadHeaderAccountStatus({
  force = false,
  timeoutMs = 8_000,
  retryDelaysMs = [150],
}: HeaderAccountStatusOptions = {}): Promise<HeaderAccountStatus> {
  if (force) clearHeaderAccountStatus();

  const currentTime = Date.now();
  if (cachedStatus && cachedStatus.expiresAt > currentTime) {
    return Promise.resolve(cachedStatus.value);
  }
  if (inFlight) return inFlight;

  const generation = cacheGeneration;
  const request = (async () => {
    for (let attempt = 0; ; attempt += 1) {
      try {
        const value = await fetchHeaderAccountStatus(timeoutMs);
        if (generation === cacheGeneration) {
          cachedStatus = { value, expiresAt: Date.now() + statusTtlMs };
        }
        return value;
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
