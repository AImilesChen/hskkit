const DEFAULT_RETRY_DELAY_MS = 2_000;
const MAX_RETRY_DELAY_MS = 10_000;
const MAX_ATTEMPTS = 2;

export type LearningLoadErrorCode = "offline" | "temporarily_unavailable" | "unavailable";

export class LearningLoadError extends Error {
  readonly code: LearningLoadErrorCode;

  constructor(code: LearningLoadErrorCode) {
    super(code);
    this.name = "LearningLoadError";
    this.code = code;
  }
}

type LoadOptions = {
  wait?: (delayMs: number) => Promise<void>;
  isOnline?: () => boolean;
  onTransientRetry?: (attempt: number, delayMs: number) => void;
};

const sleep = (delayMs: number) => new Promise<void>((resolve) => setTimeout(resolve, delayMs));

async function responseErrorCode(response: Response): Promise<string> {
  try {
    const body = await response.json() as { error?: unknown };
    return typeof body.error === "string" ? body.error : "";
  } catch {
    return "";
  }
}

function retryAfterMs(response: Response, now = Date.now()) {
  const value = response.headers.get("retry-after")?.trim();
  if (!value) return DEFAULT_RETRY_DELAY_MS;
  const seconds = Number(value);
  const delayMs = Number.isFinite(seconds) ? seconds * 1_000 : Date.parse(value) - now;
  if (!Number.isFinite(delayMs) || delayMs <= 0) return DEFAULT_RETRY_DELAY_MS;
  return Math.min(MAX_RETRY_DELAY_MS, Math.ceil(delayMs));
}

export async function loadLearningData<T>(
  request: () => Promise<Response>,
  options: LoadOptions = {},
): Promise<T> {
  const wait = options.wait ?? sleep;
  const isOnline = options.isOnline ?? (() => true);

  for (let attempt = 0; ; attempt += 1) {
    let response: Response;
    try {
      response = await request();
    } catch {
      throw new LearningLoadError(isOnline() ? "unavailable" : "offline");
    }

    if (response.ok) {
      try {
        return await response.json() as T;
      } catch {
        throw new LearningLoadError("unavailable");
      }
    }

    const errorCode = await responseErrorCode(response.clone());
    const isTransientD1 = response.status === 503 && errorCode === "D1_TEMPORARILY_UNAVAILABLE";
    if (!isTransientD1) throw new LearningLoadError(isOnline() ? "unavailable" : "offline");
    if (attempt + 1 >= MAX_ATTEMPTS) throw new LearningLoadError("temporarily_unavailable");

    const delayMs = retryAfterMs(response);
    options.onTransientRetry?.(attempt + 1, delayMs);
    await wait(delayMs);
  }
}
