export const MAX_D1_READ_ATTEMPTS = 2;
export const D1_RETRY_CONCURRENCY = 2;
export const USER_D1_READ_TIMEOUT_MS = 2_500;
const CIRCUIT_FAILURE_THRESHOLD = 3;
const CIRCUIT_OPEN_MS = 10_000;
const DEFAULT_RETRY_AFTER_SECONDS = 2;
const RETRY_DELAYS_MS = [40] as const;

let activeRetries = 0;
let consecutiveFailures = 0;
let circuitOpenUntil = 0;

export function userD1RetryAfterSeconds(now = Date.now()) {
  if (circuitOpenUntil <= now) return DEFAULT_RETRY_AFTER_SECONDS;
  return Math.max(1, Math.ceil((circuitOpenUntil - now) / 1_000));
}

export class UserD1UnavailableError extends Error {
  constructor() {
    super("D1_TEMPORARILY_UNAVAILABLE");
  }
}

class UserD1AttemptTimeoutError extends Error {
  constructor() {
    super("D1_READ_ATTEMPT_TIMED_OUT");
  }
}

async function runAttempt<T>(operation: () => Promise<T>, timeoutMs: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new UserD1AttemptTimeoutError()), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
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

export async function withUserD1ReadProtection<T>(operation: () => Promise<T>, timeoutMs: number | null = USER_D1_READ_TIMEOUT_MS): Promise<T> {
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
      const result = timeoutMs === null ? await operation() : await runAttempt(operation, timeoutMs);
      consecutiveFailures = 0;
      return result;
    } catch (error) {
      if (error instanceof UserD1AttemptTimeoutError) {
        recordTemporaryFailure();
        throw new UserD1UnavailableError();
      }
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

// Aggregate callers use this when one logical read may contain several D1 operations.
// It retries only errors reported by D1 and does not turn aggregate wall time into a D1 failure.
export function withUserD1TransientRetry<T>(operation: () => Promise<T>): Promise<T> {
  return withUserD1ReadProtection(operation, null);
}

export function resetUserD1ProtectionForTest() {
  activeRetries = 0;
  consecutiveFailures = 0;
  circuitOpenUntil = 0;
}
