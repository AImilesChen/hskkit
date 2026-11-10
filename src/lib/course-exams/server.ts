import { getCloudflareContext } from "@opennextjs/cloudflare";
import { formalIdentity, requirePaperAccess } from "@/lib/formal-exams/server";
import { d1UnavailableResponse } from "@/lib/d1/user-protection";
import { googleSignInHref } from "@/lib/account/sign-in";
import { courseAsset, coursePaperHref, isCourseForm, type CourseForm, type CourseLevel } from "./catalog";
import { parseCourseRange, courseRangeStream } from "./byte-range";

const privateHeaders = { "cache-control": "private, no-store", "x-robots-tag": "noindex, nofollow", "x-content-type-options": "nosniff" };
export async function serveCourseAsset(req: Request, form: unknown, path: string, level: CourseLevel = 1) {
  const entry = courseAsset(form, path, level);
  if (!entry || !isCourseForm(form)) return new Response(null, { status: 404, headers: privateHeaders });
  try {
    // Every paid file, including HTML, JSON, PDFs, range and HEAD requests, is checked.
    // Nothing from a paid paper is imported into a public page or client bundle.
    if (form !== "a") await requirePaperAccess(form, await formalIdentity());
    const requestedRange = parseCourseRange(req.headers.get("range"), entry.file.bytes);
    if (requestedRange === false) return new Response(null, { status: 416, headers: { ...privateHeaders, "content-range": `bytes */${entry.file.bytes}` } });
    // Store HTML under a non-HTML extension to bypass static canonical redirects.
    const assetPath = `/formal-media/${entry.paper.id}/${entry.file.storagePath}`;
    let response: Response;
    if (process.env.NODE_ENV === "development") {
      const { readFile } = await import("node:fs/promises");
      const { join } = await import("node:path");
      const bytes = await readFile(join(process.cwd(), "public", assetPath));
      const start = requestedRange ? requestedRange.start : 0;
      const end = requestedRange ? requestedRange.end : bytes.length - 1;
      response = new Response(req.method === "HEAD" ? null : new Uint8Array(bytes.subarray(start, end + 1)), { status: requestedRange ? 206 : 200, headers: { "content-type": entry.file.contentType, "content-length": String(end - start + 1), "accept-ranges": "bytes", ...(requestedRange ? { "content-range": `bytes ${start}-${end}/${bytes.length}` } : {}) } });
    } else {
      const env = (await getCloudflareContext({ async: true })).env as CloudflareEnv & { ASSETS: { fetch(request: Request): Promise<Response> } };
      const headers = new Headers({ "accept-encoding": "identity" });
      if (req.headers.has("range")) headers.set("range", req.headers.get("range")!);
      response = await env.ASSETS.fetch(new Request(new URL(assetPath, req.url), { method: req.method, headers }));
      response = new Response(req.method === "HEAD" ? null : response.body, response);
      if (requestedRange && response.status === 200) {
        const { start, end } = requestedRange;
        const rangeHeaders = new Headers(response.headers);
        rangeHeaders.set("content-range", `bytes ${start}-${end}/${entry.file.bytes}`);
        rangeHeaders.set("content-length", String(end - start + 1));
        const body = req.method === "HEAD" || !response.body ? null : courseRangeStream(response.body, start, end);
        response = new Response(body, { status: 206, headers: rangeHeaders });
      }
    }
    // Avoid a query-dependent shared cache for any paper document or file.
    for (const [key, value] of Object.entries(privateHeaders)) response.headers.set(key, value);
    response.headers.set("content-type", entry.file.contentType);
    response.headers.set("accept-ranges", "bytes");
    if (path.endsWith(".html")) {
      response.headers.set("content-security-policy", "frame-ancestors 'self'; base-uri 'self'");
      response.headers.set("permissions-policy", "microphone=(self)");
    }
    return response;
  } catch (error) {
    const unavailable = d1UnavailableResponse(error);
    if (unavailable) return unavailable;
    const code = error instanceof Error ? error.message : "COURSE_UNAVAILABLE";
    const status = code === "SIGN_IN_REQUIRED" ? 401 : ["PRO_REQUIRED", "ACCOUNT_UNAVAILABLE"].includes(code) ? 403 : 503;
    return Response.json({ error: status === 503 ? "COURSE_UNAVAILABLE" : code }, { status, headers: privateHeaders });
  }
}

export function courseAccessPage(form: CourseForm, status: number, head = false, level: CourseLevel = 1) {
  const signIn = googleSignInHref(coursePaperHref(form, level)).replaceAll("&", "&amp;");
  const message = status === 401 ? "Sign in to check your Pro access." : status === 403 ? "Paper B and Paper C are included with Pro." : "Your paper could not be opened. Please retry.";
  const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Open Chinese ${level} Paper ${form.toUpperCase()} | HSKKit</title><style>body{font:17px/1.7 system-ui;background:#f6f8fc;color:#18334a;margin:0;padding:24px}main{max-width:660px;margin:10vh auto;background:white;padding:32px;border:1px solid #dce4ef;border-radius:20px}a{display:inline-block;margin:8px 20px 8px 0;color:#5b3e86;min-height:44px}h1{line-height:1.2}</style><main><p>HSKKit · Chinese ${level} Course Review</p><h1>Paper ${form.toUpperCase()}</h1><p>${message}</p><nav>${status === 401 ? `<a href="${signIn}">Sign in</a>` : status === 403 ? '<a href="/pricing#plans">View Pro plans</a>' : `<a href="${coursePaperHref(form, level)}/practice">Retry</a>`}<a href="${coursePaperHref(form, level)}">Back to paper</a><a href="/chinese-course-tests/chinese-${level}/a">Try free Paper A</a></nav></main></html>`;
  return new Response(head ? null : html, { status, headers: { ...privateHeaders, "content-type": "text/html; charset=utf-8" } });
}
