export type BlogStatus = "draft" | "published" | "withdrawn";
export type BlogDisplayStatus = BlogStatus | "scheduled";

export type BlogInput = {
  title: string;
  slug: string;
  excerpt: string;
  contentMarkdown: string;
  featuredImageKey?: string;
  featuredImageAlt?: string;
};

const LIMITS = { title: 120, slug: 100, excerpt: 300, content: 80_000, alt: 180 } as const;
const text = (value: unknown) => typeof value === "string" ? value.trim() : "";

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
  return { title, slug, excerpt, contentMarkdown, featuredImageKey, featuredImageAlt: featuredImageKey ? featuredImageAlt : undefined };
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

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '\"': "&quot;", "'": "&#39;" }[char]!));
const safeHref = (value: string) => /^(?:https?:\/\/|\/)(?!\/)/i.test(value) ? value : undefined;
const safeImageHref = (value: string) => {
  if (!value.startsWith("/api/v1/blog/media/")) return undefined;
  try { return safeMediaKey(decodeURIComponent(value.slice("/api/v1/blog/media/".length))) ? value : undefined; } catch { return undefined; }
};
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
export function markdownToSafeHtml(markdown: string) {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const html: string[] = []; let paragraph: string[] = []; let list: string[] = []; let code: string[] | undefined;
  const flushParagraph = () => { if (paragraph.length) html.push(`<p>${inline(paragraph.join(" "))}</p>`); paragraph = []; };
  const flushList = () => { if (list.length) html.push(`<ul>${list.map((item) => `<li>${inline(item)}</li>`).join("")}</ul>`); list = []; };
  const flushAll = () => { flushParagraph(); flushList(); };
  for (const line of lines) {
    if (line.trim().startsWith("```")) { if (code) { html.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`); code = undefined; } else { flushAll(); code = []; } continue; }
    if (code) { code.push(line); continue; }
    const image = line.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (image) { flushAll(); const src = safeImageHref(image[2].trim()); if (src) html.push(`<figure><img src="${escapeHtml(src)}" alt="${escapeHtml(image[1])}" loading="lazy" /></figure>`); continue; }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) { flushAll(); const level = heading[1].length; html.push(`<h${level}>${inline(heading[2])}</h${level}>`); continue; }
    const bullet = line.match(/^[-*]\s+(.+)$/);
    if (bullet) { flushParagraph(); list.push(bullet[1]); continue; }
    const quote = line.match(/^>\s?(.+)$/);
    if (quote) { flushAll(); html.push(`<blockquote><p>${inline(quote[1])}</p></blockquote>`); continue; }
    if (!line.trim()) { flushAll(); continue; }
    flushList(); paragraph.push(line.trim());
  }
  if (code) html.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
  flushAll(); return html.join("\n");
}
