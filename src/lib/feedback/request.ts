import {
  createFeedbackSubmission,
  validateFeedbackInput,
  type FeedbackDatabase,
  type FeedbackNotification,
} from "./submission.ts";

const IDEMPOTENCY_KEY = /^[a-zA-Z0-9:_-]{16,128}$/;

type FeedbackRequestDependencies = {
  db: FeedbackDatabase;
  hashIp: (ip: string) => Promise<string>;
  notify: (feedback: FeedbackNotification) => Promise<{ id: string }>;
  generateId?: () => string;
  now?: () => string;
  nowEpochSeconds?: () => number;
};

function errorResponse(message: string, status: number, code: string): Response {
  return Response.json({ error: { code, message } }, { status });
}

async function consumeRateLimit(
  db: FeedbackDatabase,
  key: string,
  nowEpochSeconds: number,
): Promise<boolean> {
  const windowStart = Math.floor(nowEpochSeconds / 600) * 600;
  const row = await db.prepare(`
    INSERT INTO feedback_rate_limits (key, window_start, count, updated_at)
    VALUES (?, ?, 1, ?)
    ON CONFLICT(key, window_start) DO UPDATE SET
      count = feedback_rate_limits.count + 1,
      updated_at = excluded.updated_at
    RETURNING count
  `).bind(key, windowStart, nowEpochSeconds).first<{ count: number }>();
  if (!row) throw new Error("feedback_rate_limit_failed");
  return Number(row.count) <= 5;
}

export async function handleFeedbackRequest(
  request: Request,
  dependencies: FeedbackRequestDependencies,
): Promise<Response> {
  if (request.method !== "POST") return errorResponse("Method not allowed.", 405, "method_not_allowed");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON.", 400, "invalid_request");
  }

  const validation = validateFeedbackInput(body);
  if (!validation.ok) return errorResponse(validation.message, 400, validation.code);

  const idempotencyKey = request.headers.get("idempotency-key")?.trim() || "";
  if (!IDEMPOTENCY_KEY.test(idempotencyKey)) {
    return errorResponse("A valid Idempotency-Key header is required.", 400, "invalid_idempotency_key");
  }

  try {
    const ip = request.headers.get("cf-connecting-ip") || "unknown";
    const rateKey = await dependencies.hashIp(ip);
    const nowEpochSeconds = (dependencies.nowEpochSeconds ?? (() => Math.floor(Date.now() / 1000)))();
    if (!await consumeRateLimit(dependencies.db, rateKey, nowEpochSeconds)) {
      return errorResponse("Too many requests.", 429, "rate_limited");
    }

    const result = await createFeedbackSubmission(validation.value, idempotencyKey, {
      db: dependencies.db,
      generateId: dependencies.generateId ?? (() => `fb_${crypto.randomUUID().replaceAll("-", "")}`),
      now: dependencies.now ?? (() => new Date().toISOString()),
      notify: dependencies.notify,
    });
    return Response.json({ id: result.id }, { status: result.replayed ? 200 : 201 });
  } catch {
    return errorResponse("Feedback could not be saved. Please try again.", 500, "feedback_save_failed");
  }
}
