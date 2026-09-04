interface CloudflareEnv {
  LEARNING_DB: D1Database;
  COMMERCIAL_EXPORTS_R2: R2Bucket;
  BLOG_MEDIA_R2: R2Bucket;
  COMMERCIAL_EXPORT_QUEUE: Queue<{ jobId: string }>;
  COMMERCE_MODE?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  EXPORT_SIGNING_SECRET?: string;
  ADMIN_REFUND_TOKEN?: string;
  BLOG_ADMIN_EMAILS?: string;
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
