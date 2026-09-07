import { NextResponse } from "next/server";
import { UserD1UnavailableError, isUserD1TemporaryError } from "./user-retry";

export { D1_RETRY_CONCURRENCY, MAX_D1_READ_ATTEMPTS, USER_D1_READ_TIMEOUT_MS, UserD1UnavailableError, isUserD1TemporaryError, withUserD1ReadProtection } from "./user-retry";

export function d1UnavailableResponse(error: unknown) {
  if (!(error instanceof UserD1UnavailableError) && !isUserD1TemporaryError(error)) return undefined;
  return NextResponse.json(
    { error: "D1_TEMPORARILY_UNAVAILABLE", retryable: true },
    { status: 503, headers: { "retry-after": "2", "cache-control": "no-store" } },
  );
}
