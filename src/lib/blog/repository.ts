import { getCloudflareContext } from "@opennextjs/cloudflare";
import { displayStatus, normalizeBlogInput, normalizePublishAt, type BlogDisplayStatus, type BlogInput, type BlogStatus } from "./domain";

type BlogRow = {
  id: string; slug: string; title: string; excerpt: string; content_markdown: string;
  featured_image_key: string | null; featured_image_alt: string | null; status: BlogStatus;
  revision: number; published_version_number: number | null; author_user_id: string;
  published_at: string | null; created_at: string; updated_at: string;
};
type VersionRow = { id: string; post_id: string; version_number: number; snapshot_json: string; created_by_user_id: string; created_at: string };
type AuditAction = "create" | "edit" | "autosave" | "publish" | "schedule" | "withdraw" | "restore" | "upload";

export type BlogPost = BlogInput & {
  id: string; status: BlogStatus; displayStatus: BlogDisplayStatus; revision: number;
  publishedVersionNumber?: number; pendingChanges: boolean; authorUserId: string;
  publishedAt?: string; createdAt: string; updatedAt: string;
};
export type AdminBlogPostSummary = Omit<BlogPost, "contentMarkdown">;
export type BlogVersion = { id: string; versionNumber: number; createdByUserId: string; createdAt: string; snapshot: BlogPost };

const context = () => getCloudflareContext().env;
const db = () => context().LEARNING_DB;
const mapPost = (row: BlogRow): BlogPost => ({
  id: row.id, slug: row.slug, title: row.title, excerpt: row.excerpt, contentMarkdown: row.content_markdown,
  featuredImageKey: row.featured_image_key ?? undefined, featuredImageAlt: row.featured_image_alt ?? undefined,
  status: row.status, displayStatus: displayStatus(row.status, row.published_at ?? undefined), revision: Number(row.revision),
  publishedVersionNumber: row.published_version_number === null ? undefined : Number(row.published_version_number),
  pendingChanges: row.published_version_number !== null && Number(row.published_version_number) !== Number(row.revision),
  authorUserId: row.author_user_id, publishedAt: row.published_at ?? undefined, createdAt: row.created_at, updatedAt: row.updated_at,
});
const snapshot = (post: BlogPost) => JSON.stringify(post);
const summary = (post: BlogPost): AdminBlogPostSummary => { const { contentMarkdown: _, ...value } = post; return value; };

export const blogMediaUrl = (key: string) => `/api/v1/blog/media/${key.split("/").map(encodeURIComponent).join("/")}`;
export async function listAdminBlogPosts(): Promise<AdminBlogPostSummary[]> {
  const rows = await db().prepare("SELECT * FROM blog_posts ORDER BY updated_at DESC LIMIT 200").all<BlogRow>();
  return rows.results.map((row: BlogRow) => summary(mapPost(row)));
}
export async function getAdminBlogPost(id: string) {
  const row = await db().prepare("SELECT * FROM blog_posts WHERE id=?").bind(id).first<BlogRow>();
  return row ? mapPost(row) : undefined;
}
export async function listBlogVersions(postId: string): Promise<BlogVersion[]> {
  const rows = await db().prepare("SELECT * FROM blog_post_versions WHERE post_id=? ORDER BY version_number DESC LIMIT 100").bind(postId).all<VersionRow>();
  return rows.results.map((row: VersionRow) => ({ id: row.id, versionNumber: Number(row.version_number), createdByUserId: row.created_by_user_id, createdAt: row.created_at, snapshot: JSON.parse(row.snapshot_json) as BlogPost }));
}

export async function createBlogPost(raw: Record<string, unknown>, actorUserId: string, actorEmail: string) {
  const input = normalizeBlogInput(raw); const id = crypto.randomUUID(); const timestamp = new Date().toISOString();
  const post: BlogPost = { ...input, id, status: "draft", displayStatus: "draft", revision: 1, pendingChanges: false, authorUserId: actorUserId, createdAt: timestamp, updatedAt: timestamp };
  try {
    await db().batch([
      db().prepare("INSERT INTO blog_posts(id,slug,title,excerpt,content_markdown,featured_image_key,featured_image_alt,status,revision,published_version_number,author_user_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?,'draft',1,NULL,?,?,?)")
        .bind(id,input.slug,input.title,input.excerpt,input.contentMarkdown,input.featuredImageKey??null,input.featuredImageAlt??null,actorUserId,timestamp,timestamp),
      db().prepare("INSERT INTO blog_post_versions(id,post_id,version_number,snapshot_json,created_by_user_id,created_at) VALUES(?,?,1,?,?,?)")
        .bind(crypto.randomUUID(),id,snapshot(post),actorUserId,timestamp),
      db().prepare("INSERT INTO blog_audit_logs(id,actor_user_id,actor_email,action,post_id,metadata_json,created_at) VALUES(?,?,?,'create',?,'{}',?)")
        .bind(crypto.randomUUID(),actorUserId,actorEmail,id,timestamp),
    ]);
  } catch (error) { if (String(error).toLowerCase().includes("unique")) throw new Error("SLUG_CONFLICT"); throw error; }
  return post;
}

type SaveIntent = "save" | "autosave" | "publish" | "schedule" | "withdraw";
export async function saveBlogPost(id: string, raw: Record<string, unknown>, intent: SaveIntent, actorUserId: string, actorEmail: string) {
  const current = await getAdminBlogPost(id); if (!current) throw new Error("BLOG_NOT_FOUND");
  const expectedRevision = Number(raw.revision); if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 1) throw new Error("INVALID_REVISION");
  if (current.revision !== expectedRevision) throw new Error("BLOG_EDIT_CONFLICT");
  const input = normalizeBlogInput(raw);
  if (current.publishedVersionNumber && input.slug !== current.slug) throw new Error("SLUG_LOCKED_AFTER_PUBLISH");
  const sameContent = input.title===current.title && input.slug===current.slug && input.excerpt===current.excerpt && input.contentMarkdown===current.contentMarkdown && input.featuredImageKey===current.featuredImageKey && input.featuredImageAlt===current.featuredImageAlt;
  if ((intent === "save" || intent === "autosave") && sameContent) return current;
  const timestamp = new Date().toISOString(); const revision = current.revision + 1;
  let status = current.status; let publishedAt = current.publishedAt; let publishedVersionNumber = current.publishedVersionNumber; let action: AuditAction = intent === "autosave" ? "autosave" : "edit";
  if (intent === "publish" || intent === "schedule") {
    publishedAt = normalizePublishAt(intent === "schedule" ? raw.publishAt : undefined);
    const scheduled = Date.parse(publishedAt) > Date.now();
    if (intent === "schedule" && !scheduled) throw new Error("INVALID_PUBLISH_TIME");
    status = "published"; publishedVersionNumber = revision; action = scheduled ? "schedule" : "publish";
  } else if (intent === "withdraw") { status = "withdrawn"; action = "withdraw"; }
  const post: BlogPost = { ...current, ...input, status, displayStatus: displayStatus(status,publishedAt), revision, publishedVersionNumber, pendingChanges: publishedVersionNumber !== undefined && publishedVersionNumber !== revision, publishedAt, updatedAt: timestamp };
  try {
    const results = await db().batch([
      db().prepare("UPDATE blog_posts SET slug=?,title=?,excerpt=?,content_markdown=?,featured_image_key=?,featured_image_alt=?,status=?,revision=?,published_version_number=?,published_at=?,updated_at=? WHERE id=? AND revision=?")
        .bind(input.slug,input.title,input.excerpt,input.contentMarkdown,input.featuredImageKey??null,input.featuredImageAlt??null,status,revision,publishedVersionNumber??null,publishedAt??null,timestamp,id,expectedRevision),
      db().prepare("INSERT INTO blog_post_versions(id,post_id,version_number,snapshot_json,created_by_user_id,created_at) SELECT ?,?,?,?,?,? WHERE changes()=1")
        .bind(crypto.randomUUID(),id,revision,snapshot(post),actorUserId,timestamp),
      db().prepare("INSERT INTO blog_audit_logs(id,actor_user_id,actor_email,action,post_id,metadata_json,created_at) SELECT ?,?,?,?,?,?,? WHERE changes()=1")
        .bind(crypto.randomUUID(),actorUserId,actorEmail,action,id,JSON.stringify({from:current.displayStatus,to:post.displayStatus,revision,publishedVersionNumber}),timestamp),
    ]);
    if (Number(results[0]?.meta?.changes??0)!==1) throw new Error("BLOG_EDIT_CONFLICT");
  } catch (error) { const message=String(error); if(message.includes("BLOG_EDIT_CONFLICT")) throw new Error("BLOG_EDIT_CONFLICT"); if(message.toLowerCase().includes("unique")) throw new Error("SLUG_CONFLICT"); throw error; }
  const saved=await getAdminBlogPost(id); if(!saved||saved.revision!==revision) throw new Error("BLOG_EDIT_CONFLICT"); return saved;
}

export async function restoreBlogVersion(postId: string, versionNumber: number, expectedRevision: number, actorUserId: string, actorEmail: string) {
  if (!Number.isSafeInteger(versionNumber) || versionNumber < 1 || !Number.isSafeInteger(expectedRevision) || expectedRevision < 1) throw new Error("INVALID_REVISION");
  const current=await getAdminBlogPost(postId); if(!current) throw new Error("BLOG_NOT_FOUND"); if(current.revision!==expectedRevision) throw new Error("BLOG_EDIT_CONFLICT");
  const row=await db().prepare("SELECT * FROM blog_post_versions WHERE post_id=? AND version_number=?").bind(postId,versionNumber).first<VersionRow>();
  if(!row) throw new Error("BLOG_VERSION_NOT_FOUND");
  const source=JSON.parse(row.snapshot_json) as BlogPost;
  const input=normalizeBlogInput(source as unknown as Record<string,unknown>);
  if(current.publishedVersionNumber && input.slug!==current.slug) throw new Error("SLUG_LOCKED_AFTER_PUBLISH");
  const timestamp=new Date().toISOString(); const revision=current.revision+1;
  const restored: BlogPost={...current,...input,revision,updatedAt:timestamp,pendingChanges:current.publishedVersionNumber!==undefined};
  const results=await db().batch([
    db().prepare("UPDATE blog_posts SET title=?,excerpt=?,content_markdown=?,featured_image_key=?,featured_image_alt=?,revision=?,updated_at=? WHERE id=? AND revision=?")
      .bind(input.title,input.excerpt,input.contentMarkdown,input.featuredImageKey??null,input.featuredImageAlt??null,revision,timestamp,postId,expectedRevision),
    db().prepare("INSERT INTO blog_post_versions(id,post_id,version_number,snapshot_json,created_by_user_id,created_at) SELECT ?,?,?,?,?,? WHERE changes()=1")
      .bind(crypto.randomUUID(),postId,revision,snapshot(restored),actorUserId,timestamp),
    db().prepare("INSERT INTO blog_audit_logs(id,actor_user_id,actor_email,action,post_id,metadata_json,created_at) SELECT ?,?,?, 'restore',?,?,? WHERE changes()=1")
      .bind(crypto.randomUUID(),actorUserId,actorEmail,postId,JSON.stringify({sourceVersion:versionNumber,newVersion:revision}),timestamp),
  ]);
  if(Number(results[0]?.meta?.changes??0)!==1) throw new Error("BLOG_EDIT_CONFLICT");
  const saved=await getAdminBlogPost(postId); if(!saved||saved.revision!==revision) throw new Error("BLOG_EDIT_CONFLICT"); return saved;
}

function imageDimensions(bytes: Uint8Array, extension: string) {
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  if(extension==="png") { const signature=[0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]; const iend=[0,0,0,0,0x49,0x45,0x4e,0x44,0xae,0x42,0x60,0x82]; if(bytes.length<45||!signature.every((v,i)=>bytes[i]===v)||new TextDecoder().decode(bytes.slice(12,16))!=="IHDR"||!iend.every((v,i)=>bytes[bytes.length-12+i]===v)) return undefined; return {width:view.getUint32(16),height:view.getUint32(20)}; }
  if(extension==="jpg") { if(bytes.length<4||bytes[0]!==0xff||bytes[1]!==0xd8||bytes.at(-2)!==0xff||bytes.at(-1)!==0xd9) return undefined; let offset=2; while(offset+9<bytes.length){if(bytes[offset]!==0xff)return undefined;const marker=bytes[offset+1];if(marker===0xd9||marker===0xda)break;const length=view.getUint16(offset+2);if(length<2||offset+2+length>bytes.length)return undefined;if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker))return{height:view.getUint16(offset+5),width:view.getUint16(offset+7)};offset+=2+length;} }
  return undefined;
}
async function writeAudit(actorUserId:string,actorEmail:string,action:AuditAction,postId:string|undefined,metadata:Record<string,unknown>){await db().prepare("INSERT INTO blog_audit_logs(id,actor_user_id,actor_email,action,post_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?)").bind(crypto.randomUUID(),actorUserId,actorEmail,action,postId??null,JSON.stringify(metadata),new Date().toISOString()).run();}
export async function saveBlogMedia(file:File,actorUserId:string,actorEmail:string){const allowed:Record<string,string>={"image/jpeg":"jpg","image/png":"png"};const extension=allowed[file.type];if(!extension||file.size<1||file.size>2*1024*1024)throw new Error("INVALID_IMAGE");const bytes=new Uint8Array(await file.arrayBuffer());const dimensions=imageDimensions(bytes,extension);if(!dimensions||dimensions.width<1||dimensions.height<1||dimensions.width>8192||dimensions.height>8192||dimensions.width*dimensions.height>16_000_000)throw new Error("INVALID_IMAGE");const date=new Date().toISOString().slice(0,7).replace("-","/");const key=`blog/${date}/${crypto.randomUUID()}.${extension}`;await context().BLOG_MEDIA_R2.put(key,bytes,{httpMetadata:{contentType:file.type,cacheControl:"private, no-store"},customMetadata:{uploadedBy:actorUserId}});try{await writeAudit(actorUserId,actorEmail,"upload",undefined,{key,contentType:file.type,size:file.size,...dimensions});}catch(error){await context().BLOG_MEDIA_R2.delete(key).catch(()=>undefined);throw error;}return{key,url:blogMediaUrl(key)};}
export async function getBlogMedia(key:string,allowAdmin=false){if(!allowAdmin){const used=await db().prepare("SELECT 1 ok FROM blog_posts p JOIN blog_post_versions v ON v.post_id=p.id AND v.version_number=p.published_version_number WHERE p.status='published' AND p.published_at<=? AND (json_extract(v.snapshot_json,'$.featuredImageKey')=? OR instr(json_extract(v.snapshot_json,'$.contentMarkdown'),?)>0) LIMIT 1").bind(new Date().toISOString(),key,key).first<{ok:number}>();if(!used)return undefined;}return context().BLOG_MEDIA_R2.get(key);}
