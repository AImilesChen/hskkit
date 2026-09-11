import type { ReadingArticleProgress } from "./domain";

export const READING_PROGRESS_KEY = "hskkit:reading:articles:v2";
export const READING_PROGRESS_EVENT = "hskkit:reading:articles-updated";

export type ReadingProgressMap = Record<string, ReadingArticleProgress>;

export function emptyArticleProgress(slug: string, level: number, now = new Date().toISOString()): ReadingArticleProgress {
  return {
    slug,
    level,
    openedAt: now,
    lastViewedAt: now,
    scrollPercent: 0,
    completed: false,
    answeredCount: 0,
    correctCount: 0,
    wordClickCount: 0,
    reviewWordIds: [],
    favorite: false,
    readingSeconds: 0,
    needsReview: false,
  };
}

export function readLocalReadingProgress(): ReadingProgressMap {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(localStorage.getItem(READING_PROGRESS_KEY) || "{}") as ReadingProgressMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function writeLocalReadingProgress(progress: ReadingProgressMap, notify = true) {
  localStorage.setItem(READING_PROGRESS_KEY, JSON.stringify(progress));
  if (notify) window.dispatchEvent(new Event(READING_PROGRESS_EVENT));
}

export function mergeArticleProgress(left: ReadingArticleProgress | undefined, right: ReadingArticleProgress | undefined) {
  if (!left) return right;
  if (!right) return left;
  const newer = left.lastViewedAt >= right.lastViewedAt ? left : right;
  const answeredCount = Math.max(left.answeredCount, right.answeredCount);
  const correctCount = Math.max(left.correctCount, right.correctCount);
  const completed = left.completed || right.completed;
  return {
    ...newer,
    openedAt: left.openedAt <= right.openedAt ? left.openedAt : right.openedAt,
    scrollPercent: Math.max(left.scrollPercent, right.scrollPercent),
    completed,
    completedAt: left.completedAt && right.completedAt ? (left.completedAt <= right.completedAt ? left.completedAt : right.completedAt) : left.completedAt ?? right.completedAt,
    answeredCount,
    correctCount,
    accuracy: answeredCount ? Math.round((correctCount / answeredCount) * 100) : undefined,
    wordClickCount: Math.max(left.wordClickCount, right.wordClickCount),
    reviewWordIds: [...new Set([...left.reviewWordIds, ...right.reviewWordIds])],
    readingSeconds: Math.max(left.readingSeconds, right.readingSeconds),
    needsReview: answeredCount > correctCount,
  } satisfies ReadingArticleProgress;
}

export function mergeReadingProgress(local: ReadingProgressMap, remote: ReadingArticleProgress[]) {
  const merged = { ...local };
  for (const record of remote) {
    const next = mergeArticleProgress(merged[record.slug], record);
    if (next) merged[record.slug] = next;
  }
  return merged;
}

export async function loadMergedReadingProgress() {
  const local = readLocalReadingProgress();
  try {
    const response = await fetch(`/api/v1/learning?tzOffset=${new Date().getTimezoneOffset()}`, { cache: "no-store" });
    if (!response.ok) return { progress: local, revision: undefined as number | undefined, scope: "local" as const };
    const data = await response.json() as { readingArticleProgress?: ReadingArticleProgress[]; revision?: number; scope?: "account" | "guest" };
    const progress = mergeReadingProgress(local, data.readingArticleProgress ?? []);
    writeLocalReadingProgress(progress, false);
    let revision = data.revision;
    if (data.scope === "account" && revision !== undefined) {
      const remoteBySlug = Object.fromEntries((data.readingArticleProgress ?? []).map((record) => [record.slug, record]));
      const pending = Object.values(progress).filter((record) => {
        const remote = remoteBySlug[record.slug];
        return !remote || record.lastViewedAt > remote.lastViewedAt || record.scrollPercent > remote.scrollPercent || (record.completed && !remote.completed) || record.answeredCount > remote.answeredCount || record.wordClickCount > remote.wordClickCount;
      });
      for (const record of pending) {
        try {
          const synced = await syncReadingProgress("reading_article_progress", {
            articleSlug: record.slug,
            scrollPercent: record.scrollPercent,
            completed: record.completed,
            answeredCount: record.answeredCount,
            correctCount: record.correctCount,
            favorite: record.favorite,
            readingSeconds: record.readingSeconds,
          }, revision);
          revision = synced.revision;
        } catch {
          break;
        }
      }
    }
    return { progress, revision, scope: data.scope ?? "guest" };
  } catch {
    return { progress: local, revision: undefined as number | undefined, scope: "local" as const };
  }
}

export async function syncReadingProgress(action: "reading_article_progress" | "reading_article_word", payload: Record<string, unknown>, clientRevision?: number) {
  const response = await fetch("/api/v1/learning", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, idempotencyKey: crypto.randomUUID(), clientRevision, payload }),
  });
  if (!response.ok) throw new Error("READING_PROGRESS_SYNC_FAILED");
  return response.json() as Promise<{ readingArticleProgress?: ReadingArticleProgress[]; revision: number; scope: "account" | "guest" }>;
}
