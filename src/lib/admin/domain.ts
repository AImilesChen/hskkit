export type AdminConnection = "google" | "sync_key" | undefined;

export class AdminDomainError extends Error {
  status: number;
  constructor(status: number, code: string) { super(code); this.status = status; }
}

export class AdminStorageUnavailableError extends Error {
  constructor() { super("ADMIN_TEMPORARILY_UNAVAILABLE"); this.name = "AdminStorageUnavailableError"; }
}

function isD1Overload(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("D1_ERROR") && (message.includes("D1 DB is overloaded") || message.includes("Requests queued for too long") || message.includes("7429"));
}

export async function withAdminD1Retry<T>(
  operation: () => Promise<T>,
  wait: (milliseconds: number) => Promise<void> = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
) {
  const delays = [250, 750, 1_500, 3_000];
  for (let attempt = 0; attempt <= delays.length; attempt += 1) {
    try { return await operation(); } catch (error) {
      if (!isD1Overload(error)) throw error;
      if (attempt === delays.length) throw new AdminStorageUnavailableError();
      await wait(delays[attempt]);
    }
  }
  throw new AdminStorageUnavailableError();
}

export function parseAdminUserIds(value: string | undefined) {
  return new Set((value || "").split(",").map((item) => item.trim()).filter(Boolean));
}

export function authorizeAdminIdentity(
  identity: { userId: string; connection: AdminConnection } | undefined,
  allowlist: string | undefined,
) {
  if (!identity || identity.connection !== "google") throw new AdminDomainError(401, "AUTHENTICATION_REQUIRED");
  const allowed = parseAdminUserIds(allowlist);
  if (!allowed.size || !allowed.has(identity.userId)) throw new AdminDomainError(403, "ADMIN_FORBIDDEN");
  return { userId: identity.userId };
}

export function maskEmail(email: string | null | undefined) {
  if (!email) return null;
  const [local, domain] = email.trim().split("@");
  if (!local || !domain) return "***";
  return `${local.slice(0, 1)}***@${domain}`;
}

export function maskReference(reference: string | null | undefined) {
  if (!reference) return null;
  if (reference.length <= 8) return "***";
  const prefixEnd = reference.indexOf("_") >= 0 ? reference.indexOf("_") + 1 : 4;
  return `${reference.slice(0, Math.min(prefixEnd, 8))}…${reference.slice(-4)}`;
}

export function parseListQuery(search: URLSearchParams) {
  const page = Math.min(10_000, Math.max(1, Number.parseInt(search.get("page") || "1", 10) || 1));
  const pageSize = Math.min(50, Math.max(1, Number.parseInt(search.get("pageSize") || "20", 10) || 20));
  return { page, pageSize, query: (search.get("q") || "").trim().slice(0, 120) };
}

export type ReviewStatus = "unread" | "read" | "resolved";
export type FeedbackRetentionStatus = "kept" | "archived";
export function validateFeedbackReview(input: unknown): { reviewStatus: ReviewStatus; adminNote: string | null } {
  if (!input || typeof input !== "object") throw new AdminDomainError(400, "INVALID_REVIEW_INPUT");
  const candidate = input as Record<string, unknown>;
  if (!(["unread", "read", "resolved"] as unknown[]).includes(candidate.reviewStatus)) {
    throw new AdminDomainError(422, "INVALID_REVIEW_STATUS");
  }
  if (candidate.adminNote != null && typeof candidate.adminNote !== "string") throw new AdminDomainError(422, "INVALID_ADMIN_NOTE");
  const adminNote = typeof candidate.adminNote === "string" ? candidate.adminNote.trim() : "";
  if (adminNote.length > 1000) throw new AdminDomainError(422, "ADMIN_NOTE_TOO_LONG");
  return { reviewStatus: candidate.reviewStatus as ReviewStatus, adminNote: adminNote || null };
}

export function validateFeedbackRetention(input: unknown): FeedbackRetentionStatus {
  if (!input || typeof input !== "object") throw new AdminDomainError(400, "INVALID_RETENTION_INPUT");
  const retentionStatus = (input as Record<string, unknown>).retentionStatus;
  if (retentionStatus !== "kept" && retentionStatus !== "archived") throw new AdminDomainError(422, "INVALID_RETENTION_STATUS");
  return retentionStatus;
}

export function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}

export function pageMeta(total: number, page: number, pageSize: number) {
  return { total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}
