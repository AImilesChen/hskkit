const TRANSIENT_RETRY_DELAYS_MS = [800, 2000] as const;

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

    const errorCode = await responseErrorCode(response);
    const isTransientD1 = response.status === 503 && errorCode === "D1_TEMPORARILY_UNAVAILABLE";
    if (!isTransientD1) throw new LearningLoadError(isOnline() ? "unavailable" : "offline");

    const delayMs = TRANSIENT_RETRY_DELAYS_MS[attempt];
    if (delayMs === undefined) throw new LearningLoadError("temporarily_unavailable");
    options.onTransientRetry?.(attempt + 1, delayMs);
    await wait(delayMs);
  }
}
