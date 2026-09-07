import { NextRequest, NextResponse } from "next/server";
import { shouldBlockCrawler } from "./lib/traffic/bot-guard";

const consolidatedRoutes: Record<string, string> = {
  "/hsk-levels": "/levels",
  "/hsk-level-test": "/placement",
  "/new-hsk-3-0": "/hsk-3-0",
};

function gonePage(item: string) {
  const safe = item.replace(/[<>&"']/g, "");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Study item withdrawn — HSKKit</title><style>body{margin:0;background:#f8fafc;color:#0f172a;font:16px/1.6 Inter,system-ui,sans-serif}.wrap{min-height:100vh;display:grid;place-items:center;padding:20px}.card{max-width:680px;background:white;border:1px solid #e2e8f0;border-radius:16px;padding:40px;text-align:center}h1{font-size:38px;line-height:1.2}a{display:inline-flex;min-height:44px;align-items:center;background:#2563eb;color:#fff;padding:0 22px;border-radius:8px;text-decoration:none;font-weight:700}</style></head><body><main class="wrap"><section class="card"><p>410 · WITHDRAWN</p><h1>This study item is no longer available</h1><p><strong>${safe}</strong> was removed from the published release after quality review. It is not searchable or listed in the sitemap.</p><p><a href="/dictionary">Browse available material</a></p></section></main></body></html>`;
}

export function middleware(request: NextRequest) {
  const path = decodeURIComponent(request.nextUrl.pathname);
  if (path !== "/robots.txt" && shouldBlockCrawler(request.headers.get("user-agent"))) {
    return new NextResponse("Crawler access denied.\n", {
      status: 403,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "x-robots-tag": "noindex, nofollow",
        "cache-control": "public, max-age=86400",
      },
    });
  }
  const consolidated = consolidatedRoutes[path];
  if (consolidated) {
    const target = request.nextUrl.clone();
    target.pathname = consolidated;
    return NextResponse.redirect(target, 301);
  }
  if (path === "/word/withdrawn-sample" || path === "/character/撤") {
    return new NextResponse(gonePage(path.split("/").pop() || "item"), {
      status: 410,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "x-robots-tag": "noindex, nofollow",
        "cache-control": "public, max-age=0, s-maxage=300",
      },
    });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
