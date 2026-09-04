import { getCloudflareContext } from "@opennextjs/cloudflare";
import { isBlogPublicEnabled, normalizeBlogInput, normalizeStatus, type BlogInput, type BlogStatus } from "./domain";

type BlogRow = {
  id: string; slug: string; title: string; excerpt: string; content_markdown: string;
  featured_image_key: string | null; featured_image_alt: string | null; status: BlogStatus;
  revision: number; author_user_id: string; published_at: string | null; created_at: string; updated_at: string;
};

export type BlogPost = BlogInput & {
  id: string; status: BlogStatus; revision: number; authorUserId: string;
  publishedAt?: string; createdAt: string; updatedAt: string;
};
export type PublicBlogPostSummary = Omit<BlogInput, "contentMarkdown"> & {
  publishedAt: string; updatedAt: string;
};
export type PublicBlogPost = PublicBlogPostSummary & { contentMarkdown: string };
export type AdminBlogPostSummary = Omit<BlogPost, "contentMarkdown">;

const context = () => getCloudflareContext().env;
const db = () => context().LEARNING_DB;
const mapPost = (row: BlogRow): BlogPost => ({
  id: row.id, slug: row.slug, title: row.title, excerpt: row.excerpt,
  contentMarkdown: row.content_markdown, featuredImageKey: row.featured_image_key ?? undefined,
  featuredImageAlt: row.featured_image_alt ?? undefined, status: row.status, revision: Number(row.revision),
  authorUserId: row.author_user_id, publishedAt: row.published_at ?? undefined,
  createdAt: row.created_at, updatedAt: row.updated_at,
});
const mapPublicSummary = (row: BlogRow): PublicBlogPostSummary => ({
  slug: row.slug, title: row.title, excerpt: row.excerpt,
  featuredImageKey: row.featured_image_key ?? undefined,
  featuredImageAlt: row.featured_image_alt ?? undefined,
  publishedAt: row.published_at!, updatedAt: row.updated_at,
});
const snapshot = (post: BlogPost) => JSON.stringify(post);

export function blogPublicEnabled() { return isBlogPublicEnabled(context().BLOG_PUBLIC_ENABLED); }
export const blogMediaUrl = (key: string) => `/api/v1/blog/media/${key.split("/").map(encodeURIComponent).join("/")}`;

export async function listPublishedBlogPosts(limit = 50): Promise<PublicBlogPostSummary[]> {
  if (!blogPublicEnabled()) return [];
  const rows = await db().prepare("SELECT slug,title,excerpt,featured_image_key,featured_image_alt,published_at,updated_at FROM blog_posts WHERE status='published' ORDER BY published_at DESC,updated_at DESC LIMIT ?")
    .bind(Math.min(Math.max(limit, 1), 100)).all<BlogRow>();
  return rows.results.map((row: BlogRow) => mapPublicSummary(row));
}

export async function getPublishedBlogPost(slug: string): Promise<PublicBlogPost | undefined> {
  if (!blogPublicEnabled()) return undefined;
  const row = await db().prepare("SELECT slug,title,excerpt,content_markdown,featured_image_key,featured_image_alt,published_at,updated_at FROM blog_posts WHERE slug=? AND status='published'")
    .bind(slug).first<BlogRow>();
  return row ? { ...mapPublicSummary(row), contentMarkdown: row.content_markdown } : undefined;
}

export async function listAdminBlogPosts(): Promise<AdminBlogPostSummary[]> {
  const rows = await db().prepare("SELECT id,slug,title,excerpt,'' AS content_markdown,featured_image_key,featured_image_alt,status,revision,author_user_id,published_at,created_at,updated_at FROM blog_posts ORDER BY updated_at DESC LIMIT 200")
    .all<BlogRow>();
  return rows.results.map((row: BlogRow) => {
    const { contentMarkdown: _contentMarkdown, ...summary } = mapPost(row);
    return summary;
  });
}

export async function getAdminBlogPost(id: string) {
  const row = await db().prepare("SELECT * FROM blog_posts WHERE id=?").bind(id).first<BlogRow>();
  return row ? mapPost(row) : undefined;
}

async function writeAudit(actorUserId: string, actorEmail: string, action: "create" | "edit" | "publish" | "withdraw" | "upload", postId: string | undefined, metadata: Record<string, unknown>) {
  await db().prepare("INSERT INTO blog_audit_logs(id,actor_user_id,actor_email,action,post_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?)")
    .bind(crypto.randomUUID(), actorUserId, actorEmail, action, postId ?? null, JSON.stringify(metadata), new Date().toISOString()).run();
}

export async function createBlogPost(raw: Record<string, unknown>, actorUserId: string, actorEmail: string) {
  const input = normalizeBlogInput(raw);
  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const post: BlogPost = { ...input, id, status: "draft", revision: 1, authorUserId: actorUserId, createdAt: timestamp, updatedAt: timestamp };
  try {
    await db().batch([
      db().prepare("INSERT INTO blog_posts(id,slug,title,excerpt,content_markdown,featured_image_key,featured_image_alt,status,revision,author_user_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?,'draft',1,?,?,?)")
        .bind(id, input.slug, input.title, input.excerpt, input.contentMarkdown, input.featuredImageKey ?? null, input.featuredImageAlt ?? null, actorUserId, timestamp, timestamp),
      db().prepare("INSERT INTO blog_post_versions(id,post_id,version_number,snapshot_json,created_by_user_id,created_at) VALUES(?,?,1,?,?,?)")
        .bind(crypto.randomUUID(), id, snapshot(post), actorUserId, timestamp),
      db().prepare("INSERT INTO blog_audit_logs(id,actor_user_id,actor_email,action,post_id,metadata_json,created_at) VALUES(?,?,?,'create',?,'{}',?)")
        .bind(crypto.randomUUID(), actorUserId, actorEmail, id, timestamp),
    ]);
  } catch (error) {
    if (String(error).toLowerCase().includes("unique")) throw new Error("SLUG_CONFLICT");
    throw error;
  }
  return post;
}

export async function updateBlogPost(id: string, raw: Record<string, unknown>, actorUserId: string, actorEmail: string) {
  const expectedRevision = Number(raw.revision);
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 1) throw new Error("INVALID_REVISION");
  const current = await getAdminBlogPost(id);
  if (!current) throw new Error("BLOG_NOT_FOUND");
  if (current.revision !== expectedRevision) throw new Error("BLOG_EDIT_CONFLICT");
  const input = normalizeBlogInput(raw);
  const status = raw.status === undefined ? current.status : normalizeStatus(raw.status);
  const timestamp = new Date().toISOString();
  const publishedAt = status === "published" ? (current.publishedAt ?? timestamp) : status === "draft" ? undefined : current.publishedAt;
  const revision = expectedRevision + 1;
  const post: BlogPost = { ...current, ...input, status, revision, publishedAt, updatedAt: timestamp };
  const action = status !== current.status ? (status === "published" ? "publish" : status === "withdrawn" ? "withdraw" : "edit") : "edit";
  try {
    const results = await db().batch([
      db().prepare("UPDATE blog_posts SET slug=?,title=?,excerpt=?,content_markdown=?,featured_image_key=?,featured_image_alt=?,status=?,revision=?,published_at=?,updated_at=? WHERE id=? AND revision=?")
        .bind(input.slug, input.title, input.excerpt, input.contentMarkdown, input.featuredImageKey ?? null, input.featuredImageAlt ?? null, status, revision, publishedAt ?? null, timestamp, id, expectedRevision),
      db().prepare("INSERT INTO blog_post_versions(id,post_id,version_number,snapshot_json,created_by_user_id,created_at) SELECT ?,?,?,?,?,? WHERE changes()=1")
        .bind(crypto.randomUUID(), id, revision, snapshot(post), actorUserId, timestamp),
      db().prepare("INSERT INTO blog_audit_logs(id,actor_user_id,actor_email,action,post_id,metadata_json,created_at) SELECT ?,?,?,?,?,?,? WHERE changes()=1")
        .bind(crypto.randomUUID(), actorUserId, actorEmail, action, id, JSON.stringify({ from: current.status, to: status, revision }), timestamp),
    ]);
    if (Number(results[0]?.meta?.changes ?? 0) !== 1) throw new Error("BLOG_EDIT_CONFLICT");
  } catch (error) {
    const message = String(error);
    if (message.includes("BLOG_EDIT_CONFLICT")) throw new Error("BLOG_EDIT_CONFLICT");
    if (message.toLowerCase().includes("unique")) throw new Error("SLUG_CONFLICT");
    throw error;
  }
  const saved = await getAdminBlogPost(id);
  if (!saved || saved.revision !== revision) throw new Error("BLOG_EDIT_CONFLICT");
  return saved;
}

function imageDimensions(bytes: Uint8Array, extension: string) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (extension === "png") {
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    const iend = [0x00,0x00,0x00,0x00,0x49,0x45,0x4e,0x44,0xae,0x42,0x60,0x82];
    if (bytes.length < 45 || !signature.every((value, index) => bytes[index] === value)
      || new TextDecoder().decode(bytes.slice(12, 16)) !== "IHDR"
      || !iend.every((value, index) => bytes[bytes.length - 12 + index] === value)) return undefined;
    return { width: view.getUint32(16), height: view.getUint32(20) };
  }
  if (extension === "jpg") {
    if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[bytes.length - 2] !== 0xff || bytes[bytes.length - 1] !== 0xd9) return undefined;
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) return undefined;
      const marker = bytes[offset + 1];
      if (marker === 0xd9 || marker === 0xda) break;
      const length = view.getUint16(offset + 2);
      if (length < 2 || offset + 2 + length > bytes.length) return undefined;
      if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)) {
        return { height: view.getUint16(offset + 5), width: view.getUint16(offset + 7) };
      }
      offset += 2 + length;
    }
  }
  return undefined;
}

export async function saveBlogMedia(file: File, actorUserId: string, actorEmail: string) {
  const allowed: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png" };
  const extension = allowed[file.type];
  if (!extension || file.size < 1 || file.size > 2 * 1024 * 1024) throw new Error("INVALID_IMAGE");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const dimensions = imageDimensions(bytes, extension);
  if (!dimensions || dimensions.width < 1 || dimensions.height < 1 || dimensions.width > 8192 || dimensions.height > 8192 || dimensions.width * dimensions.height > 16_000_000) throw new Error("INVALID_IMAGE");
  const date = new Date().toISOString().slice(0, 7).replace("-", "/");
  const key = `blog/${date}/${crypto.randomUUID()}.${extension}`;
  await context().BLOG_MEDIA_R2.put(key, bytes, { httpMetadata: { contentType: file.type, cacheControl: "private, no-store" }, customMetadata: { uploadedBy: actorUserId } });
  try {
    await writeAudit(actorUserId, actorEmail, "upload", undefined, { key, contentType: file.type, size: file.size, ...dimensions });
  } catch (error) {
    await context().BLOG_MEDIA_R2.delete(key).catch(() => undefined);
    throw error;
  }
  return { key, url: blogMediaUrl(key) };
}

export async function getBlogMedia(key: string, allowAdmin = false) {
  if (!allowAdmin && !blogPublicEnabled()) return undefined;
  if (!allowAdmin) {
    const used = await db().prepare("SELECT 1 ok FROM blog_posts WHERE status='published' AND (featured_image_key=? OR instr(content_markdown,?)>0) LIMIT 1").bind(key, key).first<{ ok: number }>();
    if (!used) return undefined;
  }
  return context().BLOG_MEDIA_R2.get(key);
}
