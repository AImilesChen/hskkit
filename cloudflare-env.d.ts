interface CloudflareEnv {
  LEARNING_DB: D1Database;
  PLACEMENT_DB: D1Database;
  PLACEMENT_DB_MODE?: string;
  FEEDBACK_EMAIL: SendEmail;
  FEEDBACK_HASH_SECRET?: string;
  FEEDBACK_TO_EMAIL?: string;
  COMMERCIAL_EXPORTS_R2: R2Bucket;
  BLOG_MEDIA_R2: R2Bucket;
  COMMERCIAL_EXPORT_QUEUE: Queue<{ jobId: string }>;
  COMMERCE_MODE?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_TEST_SECRET_KEY?: string;
  STRIPE_LIVE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_TEST_WEBHOOK_SECRET?: string;
  STRIPE_LIVE_WEBHOOK_SECRET?: string;
  STRIPE_PAID_CHECKOUT_ENABLED?: string;
  STRIPE_PRICE_MAP?: string;
  STRIPE_TEST_PRO_PRICE_ID?: string;
  EXPORT_SIGNING_SECRET?: string;
  ADMIN_REFUND_TOKEN?: string;
  BLOG_ADMIN_EMAILS?: string;
  BLOG_ADMIN_EXTRA_EMAILS?: string;
  ADMIN_USER_IDS?: string;
  DEEPSEEK_API_KEY?: string;
  DEEPSEEK_BASE_URL?: string;
  DEEPSEEK_MODEL?: string;
  AI_DAILY_ALLOWANCE?: string;
  AI_RATE_LIMIT_PER_MINUTE?: string;
  AI_MAX_OUTPUT_TOKENS?: string;
  ASSETS: Fetcher;
  WORKER_SELF_REFERENCE: Fetcher;
  IMAGES: ImagesBinding;
}

interface SendEmail {
  send(message: import("cloudflare:email").EmailMessage): Promise<void>;
}

declare module "cloudflare:email" {
  export class EmailMessage {
    constructor(from: string, to: string, raw: string | ReadableStream);
  }
}
