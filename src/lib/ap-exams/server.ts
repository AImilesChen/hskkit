import { getCloudflareContext } from "@opennextjs/cloudflare";
import { formalIdentity, requirePaperAccess } from "@/lib/formal-exams/server";
import { d1UnavailableResponse } from "@/lib/d1/user-protection";
import { googleSignInHref } from "@/lib/account/sign-in";
import { apAsset, apPaperHref, isApForm, type ApForm } from "./catalog";

const privateHeaders = { "cache-control": "private, no-store", "x-robots-tag": "noindex, nofollow", "x-content-type-options": "nosniff" };
export async function serveApAsset(req: Request, form: unknown, path: string) {
  const entry = apAsset(form, path);
  if (!entry || !isApForm(form)) return new Response(null, { status: 404, headers: privateHeaders });
  try {
    // Every paid file, including HTML, JSON, PDFs, range and HEAD requests, is checked.
    // Nothing from a paid paper is imported into a public page or client bundle.
    if (form !== "a") await requirePaperAccess(form, await formalIdentity());
    // Store HTML under a non-HTML extension to bypass static canonical redirects.
    const assetPath = `/formal-media/${entry.paper.id}/${entry.file.storagePath}`;
    let response: Response;
    if (process.env.NODE_ENV === "development") {
      const { readFile } = await import("node:fs/promises");
      const { join } = await import("node:path");
      const bytes = await readFile(join(process.cwd(), "public", assetPath));
      const range = req.headers.get("range"), match = range?.match(/^bytes=(\d+)-(\d*)$/);
      const start = match ? Number(match[1]) : 0;
      const end = match?.[2] ? Math.min(Number(match[2]), bytes.length - 1) : bytes.length - 1;
      if (range && (!match || start > end || start >= bytes.length)) return new Response(null, { status: 416, headers: { ...privateHeaders, "content-range": `bytes */${bytes.length}` } });
      response = new Response(req.method === "HEAD" ? null : new Uint8Array(bytes.subarray(start, end + 1)), { status: match ? 206 : 200, headers: { "content-type": entry.file.contentType, "content-length": String(end - start + 1), "accept-ranges": "bytes", ...(match ? { "content-range": `bytes ${start}-${end}/${bytes.length}` } : {}) } });
    } else {
      const env = (await getCloudflareContext({ async: true })).env as CloudflareEnv & { ASSETS: { fetch(request: Request): Promise<Response> } };
      const headers = new Headers();
      if (req.headers.has("range")) headers.set("range", req.headers.get("range")!);
      response = await env.ASSETS.fetch(new Request(new URL(assetPath, req.url), { method: req.method, headers }));
      response = new Response(req.method === "HEAD" ? null : response.body, response);
    }
    // Avoid a query-dependent shared cache for any paper document or file.
    for (const [key, value] of Object.entries(privateHeaders)) response.headers.set(key, value);
    response.headers.set("content-type", entry.file.contentType);
    if (path.endsWith(".html")) {
      response.headers.set("content-security-policy", "frame-ancestors 'self'; base-uri 'self'");
      response.headers.set("permissions-policy", "microphone=(self)");
    }
    return response;
  } catch (error) {
    const unavailable = d1UnavailableResponse(error);
    if (unavailable) return unavailable;
    const code = error instanceof Error ? error.message : "AP_UNAVAILABLE";
    const status = code === "SIGN_IN_REQUIRED" ? 401 : ["PRO_REQUIRED", "ACCOUNT_UNAVAILABLE"].includes(code) ? 403 : 503;
    return Response.json({ error: status === 503 ? "AP_UNAVAILABLE" : code }, { status, headers: privateHeaders });
  }
}

export function apAccessPage(form: ApForm, status: number, head = false) {
  const signIn = googleSignInHref(apPaperHref(form)).replaceAll("&", "&amp;");
  const message = status === 401 ? "Sign in to check your Pro access." : status === 403 ? "Paper B and Paper C are included with Pro." : "Your paper could not be opened. Please retry.";
  const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Open AP Chinese Paper ${form.toUpperCase()} | HSKKit</title><style>body{font:17px/1.7 system-ui;background:#f6f8fc;color:#18334a;margin:0;padding:24px}main{max-width:660px;margin:10vh auto;background:white;padding:32px;border:1px solid #dce4ef;border-radius:20px}a{display:inline-block;margin:8px 20px 8px 0;color:#5b3e86;min-height:44px}h1{line-height:1.2}</style><main><p>HSKKit · AP Chinese 2027</p><h1>Paper ${form.toUpperCase()}</h1><p>${message}</p><nav>${status === 401 ? `<a href="${signIn}">Sign in</a>` : status === 403 ? '<a href="/pricing#plans">View Pro plans</a>' : `<a href="${apPaperHref(form)}/practice">Retry</a>`}<a href="${apPaperHref(form)}">Back to paper</a><a href="/ap-chinese-practice-test/a">Try free Paper A</a></nav></main></html>`;
  return new Response(head ? null : html, { status, headers: { ...privateHeaders, "content-type": "text/html; charset=utf-8" } });
}
