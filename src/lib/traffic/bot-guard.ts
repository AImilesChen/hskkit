const BLOCKED_CRAWLER_PATTERN = /\bmj12bot(?:\/|\b)/i;

export function shouldBlockCrawler(userAgent: string | null | undefined): boolean {
  return BLOCKED_CRAWLER_PATTERN.test(userAgent ?? "");
}
