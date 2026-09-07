export const MAX_D1_READ_ATTEMPTS = 2;
export const D1_RETRY_CONCURRENCY = 2;
const CIRCUIT_FAILURE_THRESHOLD = 3;
const CIRCUIT_OPEN_MS = 10_000;
const RETRY_DELAYS_MS = [40] as const;

let activeRetries = 0;
let consecutiveFailures = 0;
let circuitOpenUntil = 0;

export class UserD1UnavailableError extends Error {
  constructor() {
    super("D1_TEMPORARILY_UNAVAILABLE");
  }
}

export function isUserD1TemporaryError(error: unknown) {
  const value = error as { message?: unknown; code?: unknown; cause?: { message?: unknown; code?: unknown } } | null;
  const text = [value?.message, value?.code, value?.cause?.message, value?.cause?.code].filter(Boolean).join(" ").toLowerCase();
  return /(?:^|\D)7429(?:\D|$)|d1[_ ](?:db[_ ])?is overloaded|requests queued for too long|temporarily unavailable|too many requests|storage operation timed out/.test(text);
}

function recordTemporaryFailure() {
  consecutiveFailures += 1;
  if (consecutiveFailures >= CIRCUIT_FAILURE_THRESHOLD) circuitOpenUntil = Date.now() + CIRCUIT_OPEN_MS;
}

export async function withUserD1ReadProtection<T>(operation: () => Promise<T>): Promise<T> {
  if (Date.now() < circuitOpenUntil) throw new UserD1UnavailableError();
  for (let attempt = 1; attempt <= MAX_D1_READ_ATTEMPTS; attempt += 1) {
    let retrySlot = false;
    if (attempt > 1) {
      if (Date.now() < circuitOpenUntil || activeRetries >= D1_RETRY_CONCURRENCY) {
        recordTemporaryFailure();
        throw new UserD1UnavailableError();
      }
      activeRetries += 1;
      retrySlot = true;
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt - 2]));
    }
    try {
      const result = await operation();
      consecutiveFailures = 0;
      return result;
    } catch (error) {
      if (!isUserD1TemporaryError(error)) throw error;
      if (attempt === MAX_D1_READ_ATTEMPTS) {
        recordTemporaryFailure();
        throw new UserD1UnavailableError();
      }
    } finally {
      if (retrySlot) activeRetries -= 1;
    }
  }
  throw new UserD1UnavailableError();
}

export function resetUserD1ProtectionForTest() {
  activeRetries = 0;
  consecutiveFailures = 0;
  circuitOpenUntil = 0;
}
