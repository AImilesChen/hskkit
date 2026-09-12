export type PlacementLoadResponse<TSession = unknown> = {
  session: TSession | null;
  expired?: boolean;
  status?: "active" | "cooldown" | "ready" | "expired";
  latestResultId?: string | null;
  latestRecommendedLevel?: number | null;
  retakeAvailableAt?: string | null;
  canRetake?: boolean;
  serverNow?: string;
  error?: string;
  errorCode?: string;
  retryable?: boolean;
  requestId?: string;
  referenceId?: string;
  recoverableSessionId?: string;
};

export type PlacementLoadErrorCode =
  | "temporarily_unavailable"
  | "no_questions"
  | "auth_required"
  | "account_unavailable"
  | "network_unavailable"
  | "content_incompatible"
  | "state_conflict"
  | "unknown_server_error"
  | "unavailable";

type PlacementOverviewStorage = Pick<Storage, "getItem" | "setItem">;
const PLACEMENT_OVERVIEW_CACHE_KEY = "hskkit:placement:overview:v1";

export function cachePlacementOverview(storage: PlacementOverviewStorage, data: PlacementLoadResponse) {
  const safeOverview: PlacementLoadResponse = {
    session: null,
    expired: Boolean(data.expired),
    status: data.status,
    latestResultId: data.latestResultId ?? null,
    latestRecommendedLevel: data.latestRecommendedLevel ?? null,
    canRetake: data.canRetake,
    serverNow: data.serverNow,
  };
  try {
    storage.setItem(PLACEMENT_OVERVIEW_CACHE_KEY, JSON.stringify(safeOverview));
  } catch {
    // Storage can be unavailable in private browsing; loading Placement must still work.
  }
}

export function readCachedPlacementOverview(storage: Pick<Storage, "getItem">): PlacementLoadResponse | null {
  try {
    const raw = storage.getItem(PLACEMENT_OVERVIEW_CACHE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as PlacementLoadResponse;
    if (value.latestResultId !== null && typeof value.latestResultId !== "string") return null;
    if (value.latestRecommendedLevel != null && (!Number.isInteger(value.latestRecommendedLevel) || value.latestRecommendedLevel < 1 || value.latestRecommendedLevel > 9)) return null;
    return { ...value, session: null };
  } catch {
    return null;
  }
}

export function placementRetakeLocked(
  status: PlacementLoadResponse["status"],
  canRetake: boolean | undefined,
) {
  return status === "cooldown" || canRetake === false;
}

type PlacementLoadOptions = {
  request?: () => Promise<Response>;
  wait?: (delayMs: number) => Promise<void>;
  onRetry?: (attempt: number) => void;
  random?: () => number;
  maxRetries?: number;
};

const MAX_PLACEMENT_LOAD_ATTEMPTS = 4;
const MIN_RETRY_DELAY_MS = 1_000;
const MAX_RETRY_DELAY_MS = 10_000;
const MAX_TOTAL_RETRY_DELAY_MS = 15_000;
const RETRY_JITTER_MS = 250;

export class PlacementClientError extends Error {
  readonly code: PlacementLoadErrorCode;
  readonly details: PlacementLoadResponse;

  constructor(code: PlacementLoadErrorCode, details: PlacementLoadResponse = { session: null }) {
    super(code);
    this.code = code;
    this.details = details;
  }
}

const waitFor = (delayMs: number) => new Promise<void>((resolve) => setTimeout(resolve, delayMs));

function retryDelay(response: Response | null, retryAttempt: number, random: () => number) {
  const seconds = Number(response?.headers.get("retry-after"));
  const requestedDelay = Number.isFinite(seconds) && seconds >= 0 ? seconds * 1_000 : 0;
  const exponentialDelay = Math.min(MIN_RETRY_DELAY_MS * (2 ** Math.max(0, retryAttempt - 1)), MAX_RETRY_DELAY_MS);
  const jitter = Math.floor(Math.max(0, Math.min(1, random())) * RETRY_JITTER_MS);
  return Math.min(Math.max(requestedDelay, exponentialDelay) + jitter, MAX_RETRY_DELAY_MS);
}

function placementLoadCode(response: Response, data: PlacementLoadResponse): PlacementLoadErrorCode {
  const serverCode = data.errorCode ?? data.error ?? "";
  if (response.status === 401 || serverCode === "ACCOUNT_REQUIRED") return "auth_required";
  if (response.status === 403 || serverCode === "ACCOUNT_DELETED") return "account_unavailable";
  if (serverCode === "PLACEMENT_NO_QUESTIONS") return "no_questions";
  if (serverCode === "PLACEMENT_CONTENT_VERSION_MISMATCH" || serverCode === "PLACEMENT_QUESTION_NOT_FOUND") return "content_incompatible";
  if (response.status === 409 || serverCode === "REVISION_CONFLICT") return "state_conflict";
  if (response.status === 503 && serverCode === "D1_TEMPORARILY_UNAVAILABLE") return "temporarily_unavailable";
  if (response.status >= 500) return "unknown_server_error";
  return "unavailable";
}

export async function loadPlacementSession<TSession = unknown>({
  request = () => fetch("/api/v1/placement/sessions", { cache: "no-store" }),
  wait = waitFor,
  onRetry,
  random = Math.random,
  maxRetries = MAX_PLACEMENT_LOAD_ATTEMPTS - 1,
}: PlacementLoadOptions = {}): Promise<PlacementLoadResponse<TSession>> {
  let totalRetryDelayMs = 0;
  const maxAttempts = Math.max(1, Math.min(MAX_PLACEMENT_LOAD_ATTEMPTS, maxRetries + 1));
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    let response: Response | null = null;
    let data = { session: null } as PlacementLoadResponse<TSession>;
    let failureCode: PlacementLoadErrorCode;
    try {
      response = await request();
      data = await response.json().catch(() => ({ session: null })) as PlacementLoadResponse<TSession>;
      data = {
        ...data,
        requestId: data.requestId ?? response.headers.get("x-request-id") ?? undefined,
        referenceId: data.referenceId ?? response.headers.get("x-placement-reference") ?? undefined,
      };
      if (response.ok) return data;
      failureCode = placementLoadCode(response, data);
      const serverCode = data.errorCode ?? data.error;
      const transient = data.retryable !== false && (
        response.status === 429
        || (response.status === 503 && serverCode === "D1_TEMPORARILY_UNAVAILABLE")
      );
      if (!transient) throw new PlacementClientError(failureCode, data);
    } catch (reason) {
      if (reason instanceof PlacementClientError) throw reason;
      failureCode = "network_unavailable";
    }

    if (attempt === maxAttempts) throw new PlacementClientError(failureCode, data);
    const remainingRetryDelayMs = MAX_TOTAL_RETRY_DELAY_MS - totalRetryDelayMs;
    const exponentialFloor = Math.min(MIN_RETRY_DELAY_MS * (2 ** Math.max(0, attempt - 1)), MAX_RETRY_DELAY_MS);
    if (remainingRetryDelayMs < exponentialFloor) throw new PlacementClientError(failureCode, data);
    onRetry?.(attempt);
    const delayMs = Math.min(retryDelay(response, attempt, random), remainingRetryDelayMs);
    totalRetryDelayMs += delayMs;
    await wait(delayMs);
  }
  throw new PlacementClientError("temporarily_unavailable");
}

export function placementPublicError(code?: string) {
  if (code === "PLACEMENT_QUESTION_OUT_OF_SEQUENCE") {
    return "This question is already saved. Continue to the next question.";
  }
  if (code === "temporarily_unavailable" || code === "D1_TEMPORARILY_UNAVAILABLE") {
    return "Placement is temporarily busy. Your saved answers are safe. Please try again.";
  }
  if (code === "auth_required") return "Your sign-in expired. Sign in again to restore this placement.";
  if (code === "account_unavailable") return "This account cannot load Placement right now. Visit Account for details.";
  if (code === "network_unavailable") return "We could not reach HSKKit. Check your connection and try again.";
  if (code === "content_incompatible") return "This saved session uses an older question set. Your answers are safe; start a new placement.";
  if (code === "state_conflict") return "Placement changed in another tab. Reload to continue with the newest saved answers.";
  if (code === "unknown_server_error") return "Placement hit an unexpected error. Retry once or use the reference below for support.";
  if (code === "no_questions") return "Placement questions are temporarily unavailable. Please choose a level instead.";
  return "We couldn't complete that action. Please try again.";
}
