import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { handleFeedbackRequest } from "../src/lib/feedback/request.ts";
import { sendFeedbackEmail } from "../src/lib/feedback/email.ts";
import { validateFeedbackInput, type FeedbackNotification } from "../src/lib/feedback/submission.ts";

const validPayload = {
  type: "bug",
  message: "The review button is stuck.",
  email: null,
  pagePath: "/practice?hsk=3",
  browserCategory: "Chrome",
  deviceCategory: "desktop",
};

function feedbackRequest(body: unknown, key = "fb-client-1234567890abcdef", ip = "203.0.113.9") {
  return new Request("https://hskkit.com/api/feedback", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "idempotency-key": key,
      "cf-connecting-ip": ip,
    },
    body: JSON.stringify(body),
  });
}

type DbOptions = { insertChanges?: number; rateCount?: number; existingId?: string };
function mockDb(options: DbOptions = {}) {
  const operations: Array<{ sql: string; values: unknown[] }> = [];
  return {
    operations,
    prepare(sql: string) {
      return {
        bind(...values: unknown[]) {
          operations.push({ sql, values });
          return {
            async run() {
              return { meta: { changes: sql.includes("INSERT OR IGNORE INTO feedback_submissions") ? (options.insertChanges ?? 1) : 1 } };
            },
            async first<T>() {
              if (sql.includes("feedback_rate_limits")) return { count: options.rateCount ?? 1 } as T;
              if (sql.includes("idempotency_key")) return { id: options.existingId ?? "fb_existing", notification_status: "sent" } as T;
              return null;
            },
          };
        },
      };
    },
  };
}

function dependencies(db: ReturnType<typeof mockDb>, notify = async () => ({ id: "email_1" })) {
  return {
    db,
    hashIp: async () => "hash-not-the-ip",
    notify,
    generateId: () => "fb_0123456789abcdef0123456789abcdef",
    now: () => "2026-09-05T04:00:00.000Z",
    nowEpochSeconds: () => 1788580800,
  };
}

test("feedback validation accepts anonymous input and rejects invalid fields", () => {
  assert.equal(validateFeedbackInput(validPayload).ok, true);
  assert.deepEqual(validateFeedbackInput({ ...validPayload, message: "" }), {
    ok: false,
    code: "message_required",
    message: "Message is required.",
  });
  assert.equal(validateFeedbackInput({ ...validPayload, message: "x".repeat(2001) }).ok, false);
  assert.equal(validateFeedbackInput({ ...validPayload, email: "not-an-email" }).ok, false);
  assert.equal(validateFeedbackInput({ ...validPayload, pagePath: "https://evil.example" }).ok, false);
});

test("valid feedback is rate limited by a non-reversible key, stored first, then emailed", async () => {
  const db = mockDb();
  const notifications: unknown[] = [];
  const response = await handleFeedbackRequest(feedbackRequest(validPayload), dependencies(db, async (payload) => {
    notifications.push(payload);
    return { id: "email_1" };
  }));

  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { id: "fb_0123456789abcdef0123456789abcdef" });
  assert.equal(notifications.length, 1);
  assert.match(db.operations[0].sql, /feedback_rate_limits/);
  assert.equal(db.operations[0].values.includes("203.0.113.9"), false);
  assert.equal(db.operations.some(({ sql }) => sql.includes("INSERT OR IGNORE INTO feedback_submissions")), true);
  assert.equal(db.operations.at(-1)?.sql.includes("notification_status = 'sent'"), true);
});

test("the sixth request in ten minutes is rejected before submission storage", async () => {
  const db = mockDb({ rateCount: 6 });
  const response = await handleFeedbackRequest(feedbackRequest(validPayload), dependencies(db));
  assert.equal(response.status, 429);
  assert.equal(db.operations.some(({ sql }) => sql.includes("feedback_submissions")), false);
});

test("idempotent replay returns the existing id without sending another email", async () => {
  const db = mockDb({ insertChanges: 0, existingId: "fb_original" });
  let notificationCount = 0;
  const response = await handleFeedbackRequest(feedbackRequest(validPayload), dependencies(db, async () => {
    notificationCount += 1;
    return { id: "unexpected" };
  }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { id: "fb_original" });
  assert.equal(notificationCount, 0);
});

test("notification failure remains a successful saved submission and is recorded", async () => {
  const db = mockDb();
  const response = await handleFeedbackRequest(feedbackRequest(validPayload), dependencies(db, async () => {
    throw new Error("email_send_failed");
  }));
  assert.equal(response.status, 201);
  assert.equal(db.operations.at(-1)?.sql.includes("notification_status = 'failed'"), true);
});

test("email notification uses the Cloudflare binding with safe feedback metadata", async () => {
  class TestEmailMessage {
    from: string;
    to: string;
    raw: string;
    constructor(from: string, to: string, raw: string) {
      this.from = from;
      this.to = to;
      this.raw = raw;
    }
  }
  const runtime = globalThis as typeof globalThis & { __hskkitEmailMessage?: typeof TestEmailMessage };
  runtime.__hskkitEmailMessage = TestEmailMessage;
  let delivered: TestEmailMessage | null = null;
  const notification: FeedbackNotification = {
    id: "fb_email",
    type: "bug",
    message: validPayload.message,
    email: "learner@example.com",
    pagePath: validPayload.pagePath,
    browserCategory: validPayload.browserCategory,
    deviceCategory: "desktop",
    createdAt: "2026-09-05T00:00:00.000Z",
  };
  try {
    await sendFeedbackEmail(
      { send: async (message: unknown) => { delivered = message as TestEmailMessage; } } as never,
      "owner@example.com",
      notification,
    );
  } finally {
    delete runtime.__hskkitEmailMessage;
  }
  assert.ok(delivered);
  const sent = delivered as unknown as TestEmailMessage;
  assert.equal(sent.from, "feedback@hskkit.com");
  assert.equal(sent.to, "owner@example.com");
  assert.match(sent.raw, /Reply-To: learner@example\.com/);
  assert.match(sent.raw, /Feedback ID: fb_email/);
});

test("global widget, API route, D1 schema, email binding, and privacy disclosure are wired", async () => {
  const [layout, widget, css, route, migration, wrangler, privacy, patchScript, packageJson] = await Promise.all([
    readFile(new URL("../src/app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/components/feedback-widget.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../src/app/api/feedback/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../migrations/0031_feedback_submissions.sql", import.meta.url), "utf8"),
    readFile(new URL("../wrangler.jsonc", import.meta.url), "utf8"),
    readFile(new URL("../src/app/privacy-policy/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../scripts/patch-open-next-email.mjs", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);
  assert.match(layout, /<FeedbackWidget\s*\/>/);
  assert.match(widget, /\/api\/feedback/);
  assert.match(widget, /Thanks for helping us improve\./);
  assert.match(widget, /role="dialog"/);
  assert.match(css, /\.feedback-overlay[\s\S]*place-items:\s*center/);
  assert.match(css, /@media \(max-width: 700px\)[\s\S]*align-items:\s*flex-end/);
  assert.match(route, /FEEDBACK_EMAIL/);
  assert.match(migration, /CREATE TABLE feedback_submissions/);
  assert.match(migration, /CREATE TABLE feedback_rate_limits/);
  assert.match(wrangler, /"send_email"/);
  assert.match(wrangler, /\.open-next\/worker\.js/);
  assert.match(patchScript, /cloudflare:email/);
  assert.match(patchScript, /middlewareManifestPath/);
  assert.match(patchScript, /getMiddlewareManifest\(\)\{return null\}/);
  assert.match(packageJson, /patch-open-next-email\.mjs/);
  assert.match(privacy, /feedback message/i);
});
