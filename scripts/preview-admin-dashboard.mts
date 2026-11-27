// Local-only fixture preview. Never imported by the application or deployed Worker.
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { build } from "esbuild";
import { reportWindow, type DashboardAnalytics, type Report, type ReportDays } from "../src/lib/admin/analytics-model.ts";

const root = new URL("../", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const bundle = await build({
  stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import AdminDashboard from './src/app/admin/(console)/admin-dashboard'; createRoot(document.getElementById('root')).render(React.createElement(AdminDashboard));`, resolveDir: decodeURIComponent(root), loader: "tsx" },
  bundle: true, write: false, platform: "browser", format: "iife", jsx: "automatic", define: { "process.env.NODE_ENV": '"development"' },
  plugins: [{ name: "preview-link", setup(builder) {
    builder.onResolve({ filter: /^next\/link$/ }, () => ({ path: "link", namespace: "fixture" }));
    builder.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({ contents: `import React from 'react'; export default function Link({prefetch,children,...props}) {return React.createElement('a',props,children)}`, resolveDir: decodeURIComponent(root), loader: "jsx" }));
  } }],
});
const css = readFileSync(new URL("../src/app/admin/(console)/admin.css", import.meta.url), "utf8");
const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>HSKKit 管理看板 · 本地示例预览</title><style>*{box-sizing:border-box}body{margin:0;background:#f7f9fc;color:#172033;font-family:Inter,"Segoe UI","Microsoft YaHei",sans-serif}a{text-decoration:none}button,select{font:inherit}h1,h2,h3,p{overflow-wrap:anywhere}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}.preview-banner{padding:12px 20px;background:#fff5d9;color:#704614;text-align:center;font-size:13px}.preview-banner a{margin-left:16px;color:#1d4ed8}${css}</style></head><body><div class="preview-banner">本地交互预览 · 所有数字均为示例数据，不代表线上统计。<a href="/">示例数据</a><a href="/empty">未连接状态</a><a href="/partial">部分失败</a><a href="/error">请求失败</a></div><main class="admin-console"><header class="admin-header"><div><span class="admin-kicker">HSKKit operations</span><h1>Admin console</h1><p>搜索与访问表现、用户与订阅，以及反馈管理。</p></div><a href="https://hskkit.com/account">Back to account</a></header><nav class="admin-nav" aria-label="Admin sections"><a href="/" aria-current="page">数据看板</a><a href="https://hskkit.com/admin/users">Users</a><a href="https://hskkit.com/admin/subscriptions">Subscriptions</a><a href="https://hskkit.com/admin/feedback">Feedback</a></nav><div id="root"></div></main><script src="/dashboard.js"></script></body></html>`;

function fixture(days: ReportDays, mode: string): DashboardAnalytics {
  const now = new Date("2026-11-27T09:15:00Z");
  const report = (provider: "gsc" | "ga4"): Report => {
    const window = reportWindow(days, now, provider === "gsc" ? 3 : 2);
    return { provider, days, ...window, timezone: "America/Los_Angeles",
      totals: provider === "gsc" ? { clicks: days * 12, impressions: days * 330, ctr: 12 / 330, position: 18.4 } : { activeUsers: days * 19, sessions: days * 28, screenPageViews: days * 44, organicSessions: days * 7 },
      previous: provider === "gsc" ? { clicks: days * 10, impressions: days * 300, ctr: 10 / 300, position: 20.3 } : { activeUsers: days * 17, sessions: days * 26, organicSessions: days * 6 },
      trend: Array.from({ length: days }, (_, index) => ({ date: new Date(Date.parse(window.start) + index * 86_400_000).toISOString().slice(0, 10), value: Math.max(0, Math.round((provider === "gsc" ? 10 : 25) + Math.sin(index * .9) * 5 + index / 8)) })),
      keywords: provider === "gsc" ? ["hsk vocabulary", "learn chinese words", "hsk 3 practice", "chinese word order", "chinese dictionary"].map((label, index) => ({ label, value: 48 - index * 7, secondary: 800 - index * 130 })) : [],
      pages: ["/dictionary", "/vocabulary/1", "/levels", "/blog/chinese-word-order-without-word-for-word-translation", "/vocabulary/3"].map((label, index) => ({ label, value: 110 - index * 17, secondary: 1900 - index * 230 })),
    };
  };
  return { days, storageReady: true, sources: (["gsc", "ga4"] as const).map(provider => ({ provider, configured: mode !== "empty", report: mode === "empty" ? null : report(provider), syncedAt: mode === "empty" ? null : now.toISOString(), attemptedAt: mode === "empty" ? null : now.toISOString(), error: mode === "partial" && provider === "ga4" ? "REPORT_ACCESS_DENIED" : null, stale: mode === "partial" })) };
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url || "/", "http://127.0.0.1:3047");
  if (url.pathname.startsWith("/api/v1/admin/")) {
    const mode = new URL(request.headers.referer || "http://localhost/").pathname.slice(1);
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.setHeader("Cache-Control", "no-store");
    if (mode === "error") { response.writeHead(503); response.end(JSON.stringify({ error: "PREVIEW_FAILURE" })); return; }
    if (url.pathname.endsWith("overview")) {
      response.end(JSON.stringify({ registrations: 104, registrationsDay: 2, registrationsWeek: 13, activeTrials: 10, subscriptions: { live: { monthly: 3, yearly: 2 }, test: { monthly: 1, yearly: 0 } }, feedback: { unread: 2, resolved: 14 } })); return;
    }
    const days = [7, 28, 90].includes(Number(url.searchParams.get("days"))) ? Number(url.searchParams.get("days")) as ReportDays : 28;
    response.end(JSON.stringify({ ...fixture(days, mode), ...(request.method === "POST" ? { sync: "updated" } : {}) })); return;
  }
  if (url.pathname === "/dashboard.js") { response.setHeader("Content-Type", "text/javascript"); response.end(bundle.outputFiles[0].contents); return; }
  response.setHeader("Content-Type", "text/html; charset=utf-8"); response.end(html);
});
server.listen(3047, "127.0.0.1", () => console.log("Fixture preview only: http://127.0.0.1:3047"));
