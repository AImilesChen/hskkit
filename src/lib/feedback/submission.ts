const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TYPES = new Set(["bug", "suggestion", "other"]);
const DEVICES = new Set(["desktop", "mobile", "tablet", "unknown"]);

export type FeedbackType = "bug" | "suggestion" | "other";
export type FeedbackDevice = "desktop" | "mobile" | "tablet" | "unknown";

export interface FeedbackInput {
  type: FeedbackType;
  message: string;
  email: string | null;
  pagePath: string;
  browserCategory: string;
  deviceCategory: FeedbackDevice;
}

export interface FeedbackNotification extends FeedbackInput {
  id: string;
  createdAt: string;
}

export interface FeedbackDatabase {
  prepare(sql: string): {
    bind(...values: unknown[]): {
      run(): Promise<{ meta?: { changes?: number }; changes?: number }>;
      first<T>(): Promise<T | null>;
    };
  };
}

type ValidationResult =
  | { ok: true; value: FeedbackInput }
  | { ok: false; code: string; message: string };

type SubmissionDependencies = {
  db: FeedbackDatabase;
  generateId: () => string;
  now: () => string;
  notify: (feedback: FeedbackNotification) => Promise<{ id: string }>;
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function validateFeedbackInput(raw: unknown): ValidationResult {
  if (!raw || typeof raw !== "object") {
    return { ok: false, code: "invalid_request", message: "Invalid feedback request." };
  }
  const value = raw as Record<string, unknown>;
  const type = text(value.type).toLowerCase();
  const message = text(value.message);
  const email = text(value.email);
  const pagePath = text(value.pagePath);
  const browserCategory = text(value.browserCategory);
  const deviceCategory = text(value.deviceCategory).toLowerCase();

  if (!TYPES.has(type)) return { ok: false, code: "invalid_type", message: "Choose Bug, Suggestion, or Other." };
  if (!message) return { ok: false, code: "message_required", message: "Message is required." };
  if (message.length > 2000) return { ok: false, code: "message_too_long", message: "Message must be 2,000 characters or fewer." };
  if (email && (email.length > 254 || !EMAIL.test(email))) {
    return { ok: false, code: "invalid_email", message: "Enter a valid email address or leave it blank." };
  }
  if (!pagePath || pagePath.length > 500 || !pagePath.startsWith("/") || pagePath.startsWith("//")) {
    return { ok: false, code: "invalid_page_path", message: "Invalid page context." };
  }
  if (!browserCategory || browserCategory.length > 40) {
    return { ok: false, code: "invalid_browser", message: "Invalid browser context." };
  }
  if (!DEVICES.has(deviceCategory)) {
    return { ok: false, code: "invalid_device", message: "Invalid device context." };
  }

  return {
    ok: true,
    value: {
      type: type as FeedbackType,
      message,
      email: email || null,
      pagePath,
      browserCategory,
      deviceCategory: deviceCategory as FeedbackDevice,
    },
  };
}

function notificationErrorCode(error: unknown): string {
  const raw = error instanceof Error ? error.message : "notification_failed";
  return raw.replace(/[^a-z0-9_-]/gi, "_").slice(0, 120) || "notification_failed";
}

export async function createFeedbackSubmission(
  input: FeedbackInput,
  idempotencyKey: string,
  dependencies: SubmissionDependencies,
): Promise<{ id: string; replayed: boolean }> {
  const id = dependencies.generateId();
  const createdAt = dependencies.now();
  const insert = await dependencies.db.prepare(`
    INSERT OR IGNORE INTO feedback_submissions
      (id, type, message, email, page_path, browser_category, device_category, idempotency_key, notification_status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
  `).bind(
    id,
    input.type,
    input.message,
    input.email,
    input.pagePath,
    input.browserCategory,
    input.deviceCategory,
    idempotencyKey,
    createdAt,
  ).run();

  const changes = Number(insert.meta?.changes ?? insert.changes ?? 0);
  if (changes === 0) {
    const existing = await dependencies.db.prepare(
      "SELECT id, notification_status FROM feedback_submissions WHERE idempotency_key = ?",
    ).bind(idempotencyKey).first<{ id: string; notification_status: string }>();
    if (!existing?.id) throw new Error("feedback_idempotency_lookup_failed");
    return { id: existing.id, replayed: true };
  }

  try {
    const sent = await dependencies.notify({ id, ...input, createdAt });
    try {
      await dependencies.db.prepare(
        "UPDATE feedback_submissions SET notification_status = 'sent', notification_provider_id = ? WHERE id = ?",
      ).bind(sent.id, id).run();
    } catch {
      // The feedback is durable and the email has already been accepted; bookkeeping is non-blocking.
    }
  } catch (error) {
    try {
      await dependencies.db.prepare(
        "UPDATE feedback_submissions SET notification_status = 'failed', notification_error_code = ? WHERE id = ?",
      ).bind(notificationErrorCode(error), id).run();
    } catch {
      // The stored submission remains the source of truth even if notification bookkeeping fails.
    }
  }

  return { id, replayed: false };
}
