export type PlacementLoadResponse<TSession = unknown> = {
  session: TSession | null;
  expired?: boolean;
  error?: string;
};

type PlacementLoadOptions = {
  request?: () => Promise<Response>;
  wait?: (delayMs: number) => Promise<void>;
  onRetry?: (attempt: number) => void;
};

const MAX_PLACEMENT_LOAD_ATTEMPTS = 4;
const MIN_RETRY_DELAY_MS = 5_000;
const MAX_RETRY_DELAY_MS = 10_000;
const MAX_TOTAL_RETRY_DELAY_MS = 15_000;

export class PlacementClientError extends Error {
  readonly code: "temporarily_unavailable" | "no_questions" | "unavailable";

  constructor(code: "temporarily_unavailable" | "no_questions" | "unavailable") {
    super(code);
    this.code = code;
  }
}

const waitFor = (delayMs: number) => new Promise<void>((resolve) => setTimeout(resolve, delayMs));

function retryDelay(response: Response) {
  const seconds = Number(response.headers.get("retry-after"));
  const requestedDelay = Number.isFinite(seconds) && seconds >= 0 ? seconds * 1_000 : MIN_RETRY_DELAY_MS;
  return Math.min(Math.max(requestedDelay, MIN_RETRY_DELAY_MS), MAX_RETRY_DELAY_MS);
}

export async function loadPlacementSession<TSession = unknown>({
  request = () => fetch("/api/v1/placement/sessions", { cache: "no-store" }),
  wait = waitFor,
  onRetry,
}: PlacementLoadOptions = {}): Promise<PlacementLoadResponse<TSession>> {
  let totalRetryDelayMs = 0;
  for (let attempt = 1; attempt <= MAX_PLACEMENT_LOAD_ATTEMPTS; attempt += 1) {
    const response = await request();
    const data = await response.json().catch(() => ({})) as PlacementLoadResponse<TSession>;
    if (response.ok) return data;

    const temporaryD1 = response.status === 503 && data.error === "D1_TEMPORARILY_UNAVAILABLE";
    if (!temporaryD1) {
      throw new PlacementClientError(data.error === "PLACEMENT_NO_QUESTIONS" ? "no_questions" : "unavailable");
    }
    if (attempt === MAX_PLACEMENT_LOAD_ATTEMPTS) throw new PlacementClientError("temporarily_unavailable");

    const remainingRetryDelayMs = MAX_TOTAL_RETRY_DELAY_MS - totalRetryDelayMs;
    if (remainingRetryDelayMs < MIN_RETRY_DELAY_MS) throw new PlacementClientError("temporarily_unavailable");
    onRetry?.(attempt);
    const delayMs = Math.min(retryDelay(response), remainingRetryDelayMs);
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
  return "We couldn't complete that action. Please try again.";
}
