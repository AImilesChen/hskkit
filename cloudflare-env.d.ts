interface CloudflareEnv {
  LEARNING_DB: D1Database;
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
