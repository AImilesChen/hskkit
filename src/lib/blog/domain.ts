export type BlogStatus = "draft" | "published" | "withdrawn";
export type BlogDisplayStatus = BlogStatus | "scheduled";

export type BlogInput = {
  title: string;
  slug: string;
  excerpt: string;
  contentMarkdown: string;
  category: string;
  hskLevel?: number;
  featuredImageKey?: string;
  featuredImageAlt?: string;
};

const LIMITS = { title: 120, slug: 100, excerpt: 300, content: 80_000, alt: 180 } as const;
const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
export const BLOG_CATEGORIES = ["Study Guides", "Vocabulary", "Grammar", "Reading", "Listening", "Exam Preparation"] as const;

export function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, LIMITS.slug).replace(/-+$/g, "");
}

export function safeMediaKey(value: string | undefined) {
  if (!value || value.includes("..") || value.includes("//")) return undefined;
  return /^blog\/[a-zA-Z0-9/_-]+\.(?:png|jpe?g|webp)$/.test(value) ? value : undefined;
}

export function normalizeBlogInput(raw: Record<string, unknown>): BlogInput {
  const title = text(raw.title);
  const slug = slugify(text(raw.slug) || title);
  const excerpt = text(raw.excerpt);
  const contentMarkdown = text(raw.contentMarkdown);
  const requestedCategory = text(raw.category);
  const category = BLOG_CATEGORIES.includes(requestedCategory as typeof BLOG_CATEGORIES[number]) ? requestedCategory : "Study Guides";
  const requestedLevel = raw.hskLevel === "" || raw.hskLevel === null || raw.hskLevel === undefined ? undefined : Number(raw.hskLevel);
  const hskLevel = Number.isSafeInteger(requestedLevel) && Number(requestedLevel) >= 1 && Number(requestedLevel) <= 9 ? Number(requestedLevel) : undefined;
  const requestedImage = text(raw.featuredImageKey);
  const featuredImageKey = safeMediaKey(requestedImage || undefined);
  const featuredImageAlt = text(raw.featuredImageAlt);
  if (title.length < 5 || title.length > LIMITS.title) throw new Error("INVALID_TITLE");
  if (slug.length < 3 || slug.length > LIMITS.slug) throw new Error("INVALID_SLUG");
  if (excerpt.length < 20 || excerpt.length > LIMITS.excerpt) throw new Error("INVALID_EXCERPT");
  if (contentMarkdown.length < 40 || contentMarkdown.length > LIMITS.content) throw new Error("INVALID_CONTENT");
  if (requestedImage && !featuredImageKey) throw new Error("INVALID_IMAGE_KEY");
  if (featuredImageKey && (featuredImageAlt.length < 5 || featuredImageAlt.length > LIMITS.alt)) throw new Error("INVALID_IMAGE_ALT");
  if (!featuredImageKey && featuredImageAlt) throw new Error("INVALID_IMAGE_ALT");
  if (raw.hskLevel !== undefined && raw.hskLevel !== null && raw.hskLevel !== "" && hskLevel === undefined) throw new Error("INVALID_HSK_LEVEL");
  return { title, slug, excerpt, contentMarkdown, category, hskLevel, featuredImageKey, featuredImageAlt: featuredImageKey ? featuredImageAlt : undefined };
}

export type PublicBlogQuery = { q: string; category: string; sort: "newest" | "oldest" | "title"; page: number; limit: 9 };
export function normalizePublicBlogQuery(raw: Record<string, string | string[] | undefined>): PublicBlogQuery {
  const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] ?? "" : value ?? "";
  const q = first(raw.q).trim().replace(/\s+/g, " ").slice(0, 80);
  const category = first(raw.category).trim().slice(0, 40);
  const requestedSort = first(raw.sort);
  const sort: PublicBlogQuery["sort"] = requestedSort === "oldest" || requestedSort === "title" ? requestedSort : "newest";
  const parsedPage = Number.parseInt(first(raw.page), 10);
  const page = Number.isFinite(parsedPage) ? Math.min(20, Math.max(1, parsedPage)) : 1;
  return { q, category, sort, page, limit: 9 };
}

export function normalizePublishAt(value: unknown, now = new Date()) {
  if (value === undefined || value === null || value === "") return now.toISOString();
  if (typeof value !== "string") throw new Error("INVALID_PUBLISH_TIME");
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.valueOf())) throw new Error("INVALID_PUBLISH_TIME");
  if (parsed.valueOf() > now.valueOf() + 365 * 24 * 60 * 60_000) throw new Error("INVALID_PUBLISH_TIME");
  return parsed.toISOString();
}

export function displayStatus(status: BlogStatus, publishedAt?: string): BlogDisplayStatus {
  return status === "published" && publishedAt && Date.parse(publishedAt) > Date.now() ? "scheduled" : status;
}

export function isEmailAllowed(email: string | undefined, allowlist: string | undefined) {
  if (!email || !allowlist) return false;
  const candidate = email.trim().toLowerCase();
  return allowlist.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean).includes(candidate);
}

export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  const site = request.headers.get("sec-fetch-site");
  const requestUrl = new URL(request.url);
  const publicHost = request.headers.get("host") || requestUrl.host;
  let originUrl: URL | undefined;
  try { originUrl = origin ? new URL(origin) : undefined; } catch {}
  return Boolean(originUrl && ["http:", "https:"].includes(originUrl.protocol) && originUrl.host === publicHost && (!site || site === "same-origin"));
}

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]!));
const safeHref = (value: string) => /^(?:https?:\/\/|\/)(?!\/)/i.test(value) ? value : undefined;
const safeImageHref = (value: string) => {
  if (!value.startsWith("/api/v1/blog/media/")) return undefined;
  try { return safeMediaKey(decodeURIComponent(value.slice("/api/v1/blog/media/".length))) ? value : undefined; } catch { return undefined; }
};
const plainInline = (value: string) => value.replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[*_`~]/g, "").replace(/<[^>]*>/g, "").trim();
function inline(value: string) {
  let output = escapeHtml(value);
  output = output.replace(/`([^`]+)`/g, "<code>$1</code>");
  output = output.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_all, label: string, href: string) => {
    const safe = safeHref(href.trim());
    return safe ? `<a href="${escapeHtml(safe)}"${safe.startsWith("http") ? ' rel="noopener noreferrer"' : ""}>${label}</a>` : label;
  });
  output = output.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  output = output.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  return output;
}

export type BlogHeading = { level: 2 | 3; text: string; id: string };
export type BlogFaq = { question: string; answer: string };
function headingId(value: string, seen: Map<string, number>) {
  const base = plainInline(value).toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "section";
  const count = (seen.get(base) ?? 0) + 1;
  seen.set(base, count);
  return count === 1 ? base : `${base}-${count}`;
}
export function extractBlogHeadings(markdown: string): BlogHeading[] {
  const seen = new Map<string, number>();
  return markdown.replace(/\r\n?/g, "\n").split("\n").flatMap((line) => {
    const match = line.match(/^(#{2,3})\s+(.+)$/);
    if (!match) return [];
    const text = plainInline(match[2]);
    return [{ level: match[1].length as 2 | 3, text, id: headingId(text, seen) }];
  });
}
export function extractBlogFaqs(markdown: string): BlogFaq[] {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const faqs: BlogFaq[] = [];
  let inFaq = false; let question = ""; let answer: string[] = [];
  const flush = () => {
    const cleanAnswer = plainInline(answer.filter((line) => !/^\s*</.test(line)).join(" ").replace(/\s+/g, " "));
    if (question && cleanAnswer) faqs.push({ question: plainInline(question), answer: cleanAnswer });
    question = ""; answer = [];
  };
  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) { if (inFaq) flush(); inFaq = /^(faq|frequently asked questions)$/i.test(plainInline(h2[1])); continue; }
    if (!inFaq) continue;
    const h3 = line.match(/^###\s+(.+)$/);
    if (h3) { flush(); question = h3[1]; continue; }
    if (question && line.trim()) answer.push(line.trim());
  }
  if (inFaq) flush();
  return faqs.slice(0, 12);
}
export function estimateReadingMinutes(markdown: string) {
  const text = plainInline(markdown);
  const latinWords = text.replace(/[\u3400-\u9fff]/g, " ").split(/\s+/).filter(Boolean).length;
  const cjk = (text.match(/[\u3400-\u9fff]/g) ?? []).length;
  return Math.max(1, Math.ceil(latinWords / 220 + cjk / 300));
}
const splitTableRow = (line: string) => line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
export function markdownToSafeHtml(markdown: string) {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const headingIds = extractBlogHeadings(markdown); let headingIndex = 0;
  const html: string[] = []; let paragraph: string[] = []; let list: string[] = []; let ordered: string[] = []; let code: string[] | undefined;
  const flushParagraph = () => { if (paragraph.length) html.push(`<p>${inline(paragraph.join(" "))}</p>`); paragraph = []; };
  const flushList = () => { if (list.length) html.push(`<ul>${list.map((item) => `<li>${inline(item)}</li>`).join("")}</ul>`); list = []; };
  const flushOrdered = () => { if (ordered.length) html.push(`<ol>${ordered.map((item) => `<li>${inline(item)}</li>`).join("")}</ol>`); ordered = []; };
  const flushAll = () => { flushParagraph(); flushList(); flushOrdered(); };
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.trim().startsWith("```")) { if (code) { html.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`); code = undefined; } else { flushAll(); code = []; } continue; }
    if (code) { code.push(line); continue; }
    const image = line.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (image) { flushAll(); const src = safeImageHref(image[2].trim()); if (src) html.push(`<figure><img src="${escapeHtml(src)}" alt="${escapeHtml(image[1])}" loading="lazy" /></figure>`); continue; }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) { flushAll(); const level = heading[1].length; const id = level >= 2 ? ` id="${headingIds[headingIndex++]?.id}"` : ""; html.push(`<h${level}${id}>${inline(heading[2])}</h${level}>`); continue; }
    const separator = lines[index + 1];
    if (/^\s*\|.*\|\s*$/.test(line) && separator && /^\s*\|?(?:\s*:?-{3,}:?\s*\|)+\s*$/.test(separator)) {
      flushAll(); const headers = splitTableRow(line); const rows: string[][] = []; index += 2;
      while (index < lines.length && /^\s*\|.*\|\s*$/.test(lines[index])) { rows.push(splitTableRow(lines[index])); index += 1; }
      index -= 1;
      html.push(`<div class="blog-table-wrap"><table><thead><tr>${headers.map((cell) => `<th>${inline(cell)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${headers.map((_, cellIndex) => `<td>${inline(row[cellIndex] ?? "")}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`); continue;
    }
    const bullet = line.match(/^[-*]\s+(.+)$/);
    if (bullet) { flushParagraph(); flushOrdered(); list.push(bullet[1]); continue; }
    const number = line.match(/^\d+[.)]\s+(.+)$/);
    if (number) { flushParagraph(); flushList(); ordered.push(number[1]); continue; }
    const quote = line.match(/^>\s?(.+)$/);
    if (quote) { flushAll(); html.push(`<blockquote><p>${inline(quote[1])}</p></blockquote>`); continue; }
    if (!line.trim()) { flushAll(); continue; }
    flushList(); flushOrdered(); paragraph.push(line.trim());
  }
  if (code) html.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
  flushAll(); return html.join("\n");
}
