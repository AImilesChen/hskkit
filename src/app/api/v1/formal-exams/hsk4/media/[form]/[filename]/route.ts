import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { examPaper } from "@/lib/formal-exams/hsk4/catalog";
import { isForm } from "@/lib/formal-exams/hsk4/domain";
import { formalIdentity, requirePaperAccess } from "@/lib/formal-exams/hsk4/server";
import { d1UnavailableResponse } from "@/lib/d1/user-protection";

export const dynamic = "force-dynamic";
export async function GET(req: NextRequest, { params }: { params: Promise<{ form: string; filename: string }> }) {
  try {
    const { form, filename } = await params;
    if (!isForm(form) || !/^[a-zA-Z0-9-]+\.(mp3|svg|json|txt|TXT)$/.test(filename)) return new NextResponse(null, { status: 404 });
    const paper = examPaper(form);
    const allowed = new Set(["listening-full.mp3", ...Object.values(paper.images), ...paper.parts.flatMap(p => [...(p.example ? [p.example] : []), ...p.questions]).flatMap(q => q.audioSrc ? [q.audioSrc.split("/").at(-1)!] : [])]);
    if (!allowed.has(filename)) return new NextResponse(null, { status: 404 });
    // A is public; B/C authorization runs even for range and cache-validation requests.
    if (form !== "a") await requirePaperAccess(form, await formalIdentity());
    // Next's local development proxy does not provide the static ASSETS binding.
    // This branch is removed from production builds; production streams from ASSETS below.
    if (process.env.NODE_ENV === "development") {
      const { readFile } = await import("node:fs/promises");
      const { join } = await import("node:path");
      const file = await readFile(join(process.cwd(), "public", "formal-media", paper.id, filename));
      const range = req.headers.get("range");
      const match = range?.match(/^bytes=(\d+)-(\d*)$/);
      const start = match ? Number(match[1]) : 0;
      const end = match?.[2] ? Math.min(Number(match[2]), file.length - 1) : file.length - 1;
      if (range && (!match || start > end || start >= file.length)) return new Response(null, { status: 416 });
      const bytes = new Uint8Array(file.subarray(start, end + 1));
      return new Response(bytes, { status: match ? 206 : 200, headers: {
        "content-type": filename.endsWith(".mp3") ? "audio/mpeg" : filename.endsWith(".svg") ? "image/svg+xml" : filename.endsWith(".json") ? "application/json" : "text/plain; charset=utf-8",
        "content-length": String(bytes.byteLength), "accept-ranges": "bytes", "cache-control": "private, no-store",
        ...(match ? { "content-range": `bytes ${start}-${end}/${file.length}` } : {}),
      } });
    }
    const env = (await getCloudflareContext({ async: true })).env as CloudflareEnv & { ASSETS: { fetch(request: Request): Promise<Response> } };
    const url = new URL(`/formal-media/${paper.id}/${filename}`, req.url);
    const headers = new Headers();
    if (req.headers.has("range")) headers.set("range", req.headers.get("range")!);
    const asset = await env.ASSETS.fetch(new Request(url, { headers }));
    const result = new Response(asset.body, asset);
    result.headers.set("cache-control", form === "a" ? "public, max-age=3600" : "private, no-store");
    result.headers.set("x-robots-tag", "noindex, nofollow");
    result.headers.set("x-content-type-options", "nosniff");
    return result;
  } catch (error) {
    const unavailable = d1UnavailableResponse(error);
    if (unavailable) return unavailable;
    const code = error instanceof Error ? error.message : "EXAM_UNAVAILABLE";
    const status = code === "SIGN_IN_REQUIRED" ? 401 : code === "PRO_REQUIRED" || code === "ACCOUNT_UNAVAILABLE" ? 403 : 503;
    return NextResponse.json({ error: status === 503 ? "EXAM_UNAVAILABLE" : code }, { status, headers: { "cache-control": "private, no-store" } });
  }
}
