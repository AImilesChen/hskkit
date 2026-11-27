"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { percentChange, REPORT_DAYS, type DashboardAnalytics, type ReportDays, type ReportRow, type SourceState } from "@/lib/admin/analytics-model";
import type { getAdminOverview } from "@/lib/admin/repository";

type Operations = Awaited<ReturnType<typeof getAdminOverview>>;
type Load<T> = { data: T | null; error: string | null; loading: boolean };
const initial = { data: null, error: null, loading: true };
const format = (value: number | null | undefined) => value == null ? "—" : new Intl.NumberFormat("en-US").format(value);
const updated = (value: string | null | undefined) => value ? new Intl.DateTimeFormat("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" }).format(new Date(value)) + " UTC" : "尚未同步";

async function request<T>(path: string, signal: AbortSignal, method = "GET"): Promise<T> {
  const response = await fetch(path, { method, signal, cache: "no-store", credentials: "same-origin" });
  if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? "登录状态已失效，请重新登录后台。" : response.status === 409 ? "已有同步正在进行，请稍后读取汇总。" : "暂时无法读取，请重试。已有数据不会被清除。");
  return response.json();
}

function Metric({ label, value, previous, detail, color = "blue" }: { label: string; value?: number | null; previous?: number | null; detail: string; color?: string }) {
  const change = percentChange(value, previous);
  return <article className={`admin-kpi ${color}`}><span>{label}</span><strong>{format(value)}</strong><small>{detail}</small>{change != null && <span className={`admin-change ${change >= 0 ? "positive" : "negative"}`}>{change >= 0 ? "↑" : "↓"} {Math.abs(change).toFixed(1)}% <small>较上一等长周期</small></span>}</article>;
}

function Trend({ title, source, unit, color }: { title: string; source?: SourceState; unit: string; color: string }) {
  const report = source?.report;
  const points = report?.trend || [];
  const max = Math.max(1, ...points.map(point => point.value));
  const start = report ? Date.parse(report.start) : 0;
  const length = report ? Math.max(1, (Date.parse(report.end) - start) / 86_400_000) : 1;
  const coordinates = points.map(point => `${24 + (Date.parse(point.date) - start) / 86_400_000 / length * 552},${150 - point.value / max * 124}`).join(" ");
  return <article className="admin-board-panel"><header><div><span className={`admin-source-label ${color}`}>{source?.provider === "gsc" ? "GOOGLE SEARCH CONSOLE" : "GOOGLE ANALYTICS 4"}</span><h3>{title}</h3></div><span className="admin-muted">{unit}</span></header>
    {report ? <><svg className={`admin-trend ${color}`} viewBox="0 0 600 184" role="img" aria-label={`${title}，${report.start} 至 ${report.end}；每日明细可在下方展开查看`}><title>{title}</title>{[26, 88, 150].map(y => <line key={y} x1="24" x2="576" y1={y} y2={y} stroke="#e4eaf2" />)}<text x="24" y="16">{format(max)}</text><text x="24" y="174">{report.start.slice(5)}</text><text x="576" y="174" textAnchor="end">{report.end.slice(5)}</text>{points.length > 1 ? <polyline points={coordinates} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /> : points.length === 1 ? <circle cx="24" cy={150 - points[0].value / max * 124} r="4" fill="currentColor" /> : null}</svg>
      {!points.length && <p className="admin-muted">该周期暂无每日数据。</p>}
      <div className="admin-chart-meta"><span>{report.start} → {report.end}</span><span>{report.timezone}</span></div>
      <details className="admin-trend-data"><summary>查看每日明细</summary><div className="admin-compact-table"><table><thead><tr><th>日期</th><th>{unit}</th></tr></thead><tbody>{points.map(point => <tr key={point.date}><td>{point.date}</td><td>{format(point.value)}</td></tr>)}</tbody></table></div></details>
    </> : <div className="admin-chart-empty"><span aria-hidden="true">↗</span><strong>{source?.configured ? "等待首次同步" : "等待连接报表"}</strong><p>同步后显示真实趋势，暂无数据时不生成示例曲线。</p></div>}
  </article>;
}

function Ranking({ title, rows, primary, secondary, ready }: { title: string; rows: ReportRow[]; primary: string; secondary?: string; ready: boolean }) {
  return <article className="admin-board-panel"><header><h3>{title}</h3><span className="admin-muted">Top 10</span></header>{rows.length ? <div className="admin-compact-table"><table><thead><tr><th>{title.includes("关键词") ? "关键词" : "页面"}</th><th>{primary}</th>{secondary && <th>{secondary}</th>}</tr></thead><tbody>{rows.map((row, index) => <tr key={`${index}-${row.label}`}><td><span className="admin-rank-number">{index + 1}</span><span className="admin-rank-label" title={row.label}>{row.label.replace(/^https:\/\/hskkit.com/, "") || "/"}</span></td><td>{format(row.value)}</td>{secondary && <td>{format(row.secondary)}</td>}</tr>)}</tbody></table></div> : <div className="admin-small-empty">{ready ? "该周期没有可展示的记录。" : "连接并同步后显示真实数据。"}</div>}</article>;
}

function sourceMessage(source: SourceState | undefined, storageReady: boolean) {
  if (!storageReady) return "汇总存储尚未启用";
  if (source?.error === "REPORT_ACCESS_DENIED") return "报表读取权限待确认";
  if (source?.error === "REPORT_API_DISABLED") return "Google 报表 API 尚未启用";
  if (source?.error) return source.report ? "同步失败，保留上次数据" : "同步失败，请稍后重试";
  if (source?.stale) return "数据待更新";
  if (source?.report) return "已同步";
  return source?.configured ? "等待首次同步" : "报表读取待连接";
}

export function AdminDashboardView({ days, setDays, analytics, operations, refresh, refreshing, reload, notice }: {
  days: ReportDays; setDays: (days: ReportDays) => void; analytics: Load<DashboardAnalytics>; operations: Load<Operations>;
  refresh: () => void; refreshing: boolean; reload: () => void; notice: string;
}) {
  const gsc = analytics.data?.sources.find(source => source.provider === "gsc");
  const ga4 = analytics.data?.sources.find(source => source.provider === "ga4");
  const search = gsc?.report;
  const visits = ga4?.report;
  const op = operations.data;
  const storageReady = analytics.data?.storageReady ?? true;
  const syncable = storageReady && analytics.data?.sources.some(source => source.configured);
  return <section className="admin-board" aria-label="运营数据看板"><div className="admin-board-title"><div><span className="admin-kicker">OPERATIONS OVERVIEW</span><h2>运营数据看板</h2><p>从搜索曝光到访问，再到注册与订阅。</p></div><div className="admin-board-controls"><label><span className="sr-only">报表周期</span><select value={days} disabled={refreshing} onChange={event => setDays(Number(event.target.value) as ReportDays)}>{REPORT_DAYS.map(day => <option key={day} value={day}>最近 {day} 天</option>)}</select></label><button onClick={refresh} disabled={refreshing || !syncable} type="button">{refreshing ? "正在同步…" : "同步报表"}</button></div></div>
    <p className="admin-board-note">报表按各自时区统计，使用已结束日期；本站运营总览为当前状态。同步不会重新安装统计代码。</p>
    {analytics.data?.connection?.canConnect && (!analytics.data.connection.connected || analytics.data.sources.some(source => source.error === "REPORT_ACCESS_DENIED" || source.error === "REPORT_CREDENTIALS_INVALID")) && <div className="admin-reporting-connect"><div><strong>{analytics.data.connection.connected ? "管理 Google 报表授权" : "连接现有 Google 报表"}</strong><p>仅请求 Search Console 和 Analytics 的只读权限。授权凭据加密保存在服务端，之后自动同步。</p></div><form method="post" action="/api/v1/admin/analytics/connect"><button type="submit">{analytics.data.connection.connected ? "重新授权 Google" : "连接 Google 报表"}</button></form></div>}
    {(analytics.error || operations.error) && <div className="admin-dashboard-alert" role="alert">{analytics.error || operations.error} <button type="button" onClick={reload}>重新读取</button></div>}
    <p className="admin-sync-notice" role="status" aria-live="polite">{notice || (analytics.loading ? "正在读取已保存的报表…" : refreshing ? "正在读取平台数据，现有汇总保持可见。" : "")}</p>
    <div className="admin-kpi-grid" aria-busy={analytics.loading}>
      <Metric label="Google 搜索点击" value={search?.totals.clicks} previous={search?.previous.clicks} detail="Search Console · 自然搜索" />
      <Metric label="Google 搜索展示" value={search?.totals.impressions} previous={search?.previous.impressions} detail="Search Console · Web 搜索" color="violet" />
      <Metric label="自然搜索访问" value={visits?.totals.organicSessions} previous={visits?.previous.organicSessions} detail="GA4 · Organic Search 会话" color="teal" />
      <Metric label="累计注册用户" value={op?.registrations} detail={op ? `近 24 小时 ${format(op.registrationsDay)} · 近 7 天 ${format(op.registrationsWeek)}` : operations.loading ? "正在读取本站数据…" : "本站数据暂不可用"} color="amber" />
    </div>
    <div className="admin-board-grid"><Trend title="搜索点击趋势" source={gsc} unit="点击" color="blue" /><Trend title="网站访问趋势" source={ga4} unit="会话" color="teal" /></div>
    <div className="admin-inline-stats"><span>搜索点击率 <strong>{search ? `${((search.totals.ctr || 0) * 100).toFixed(2)}%` : "—"}</strong></span><span>平均排名 <strong>{search?.totals.position != null ? search.totals.position.toFixed(1) : "—"}</strong></span><span>活跃用户 <strong>{format(visits?.totals.activeUsers)}</strong></span><span>总访问次数 <strong>{format(visits?.totals.sessions)}</strong></span></div>
    <div className="admin-board-grid"><Ranking title="带来点击的关键词" rows={search?.keywords || []} primary="点击" secondary="展示" ready={Boolean(search)} /><Ranking title="Google 热门页面" rows={search?.pages || []} primary="点击" secondary="展示" ready={Boolean(search)} /></div>
    <p className="admin-board-note">关键词表只显示平台可返回的前 10 项，可能不包含匿名查询；不用于计算整体点击总量。</p>
    <Ranking title="热门落地页" rows={visits?.pages || []} primary="会话" ready={Boolean(visits)} />
    <div className="admin-board-section-title"><div><h3>本站运营</h3><p>当前生产数据 · 独立于 SEO 报表周期</p></div><Link href="/admin/users" prefetch={false}>管理用户 →</Link></div>
    <div className="admin-metrics" aria-busy={operations.loading}>{[
      ["累计注册 / Registrations", op?.registrations, op ? `近 24 小时 ${op.registrationsDay} · 近 7 天 ${op.registrationsWeek}` : "正在读取本站数据"],
      ["有效试用", op?.activeTrials, "当前有效的 7 天 Pro 试用"],
      ["正式订阅", op ? op.subscriptions.live.monthly + op.subscriptions.live.yearly : null, op ? `${op.subscriptions.live.monthly} 月付 · ${op.subscriptions.live.yearly} 年付` : "仅正式环境"],
      ["测试订阅", op ? op.subscriptions.test.monthly + op.subscriptions.test.yearly : null, "不计入正式订阅"],
      ["未读反馈", op?.feedback.unread, "等待处理"], ["已解决反馈", op?.feedback.resolved, "保留审核记录"],
    ].map(([label, value, detail]) => <article className="admin-metric" key={String(label)}><span>{label}</span><strong>{format(value as number | null | undefined)}</strong><small>{detail}</small></article>)}</div>
    <div className="admin-board-section-title"><div><h3>数据连接与更新</h3><p>采集代码与平台账户保持原样，仅增加报表读取。</p></div></div>
    <div className="admin-source-grid">{[
      { name: "Google Search Console", source: gsc, href: "https://search.google.com/search-console", note: "搜索表现 · 数据截至", color: "blue" },
      { name: "Google Analytics 4", source: ga4, href: "https://analytics.google.com/", note: "访问与自然搜索 · 数据截至", color: "teal" },
    ].map(item => <article className="admin-source-card" key={item.name}><span className={`admin-source-label ${item.color}`}>{item.name}</span><strong>{sourceMessage(item.source, storageReady)}</strong><p>{item.source?.report ? `${item.note} ${item.source.report.end}` : "沿用现有站点与属性，等待读取平台报表。"}</p><small>最近成功同步：{updated(item.source?.syncedAt)}</small><a href={item.href} target="_blank" rel="noreferrer">打开平台 ↗</a></article>)}
      <article className="admin-source-card"><span className="admin-source-label violet">其他已使用平台</span><strong>保留平台入口</strong><p>Plausible 与 Ahrefs 的报表接口权限尚待核实，本版不显示推测数据。</p><a href="https://plausible.shipsolo.io/hskkit.com" target="_blank" rel="noreferrer">Plausible ↗</a><a href="https://app.ahrefs.com/" target="_blank" rel="noreferrer">Ahrefs ↗</a></article>
    </div>
    <div className="admin-board-footer"><span>页面读取已保存的汇总；手动同步最短间隔 15 分钟，失败时保留上次成功数据。</span><div><Link href="/admin/subscriptions" prefetch={false}>查看订阅 →</Link><Link href="/admin/feedback" prefetch={false}>处理反馈 →</Link></div></div>
  </section>;
}

export default function AdminDashboard() {
  const [days, setDays] = useState<ReportDays>(28);
  const [analytics, setAnalytics] = useState<Load<DashboardAnalytics>>(initial);
  const [operations, setOperations] = useState<Load<Operations>>(initial);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState("");
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    setAnalytics(previous => ({ data: previous.data?.days === days ? previous.data : null, error: null, loading: true }));
    setNotice("");
    const result = new URL(window.location.href).searchParams.get("reporting");
    const notices: Record<string, string> = { connected: "Google 报表已连接，首次汇总已完成。", partial: "Google 授权已保存，部分报表暂未同步。请查看下方连接状态。", cancelled: "已取消报表授权，现有数据保持不变。", invalid_state: "授权流程已失效，请从后台重新连接。", scopes_missing: "需要同时勾选 Search Console 与 Analytics 的只读权限。", refresh_missing: "Google 未返回自动更新凭据，请重新授权。", failed: "报表授权未完成，请从后台重新连接。" };
    if (result && notices[result] && result !== "connected" && result !== "partial") setNotice(notices[result]);
    let firstSyncTimer: ReturnType<typeof setTimeout> | undefined;
    request<DashboardAnalytics>(`/api/v1/admin/analytics?days=${days}`, controller.signal).then(async data => {
      clearTimeout(timeout);
      if (controller.signal.aborted) return;
      setAnalytics({ data, error: null, loading: false });
      if (result === "connected" && data.connection?.connected) setNotice(data.sources.every(source => source.report && !source.error) ? notices.connected : notices.partial);
      if (result === "partial" && data.connection?.connected) setNotice(notices.partial);
      if (data.sources.some(source => source.configured && !source.report && !source.attemptedAt)) {
        setRefreshing(true);
        setNotice("正在首次同步这个周期的真实报表…");
        firstSyncTimer = setTimeout(() => controller.abort(), 30_000);
        const synced = await request<DashboardAnalytics>(`/api/v1/admin/analytics?days=${days}`, controller.signal, "POST");
        if (!controller.signal.aborted) {
          setAnalytics({ data: synced, error: null, loading: false });
          setNotice(synced.sources.some(source => source.error) ? "部分报表同步失败，请查看连接状态。" : "首次报表同步完成。");
        }
      }
    }).catch(error => {
      if (!controller.signal.aborted) setAnalytics(previous => ({ ...previous, error: error.message, loading: false }));
    }).finally(() => { clearTimeout(timeout); clearTimeout(firstSyncTimer); if (firstSyncTimer) setRefreshing(false); });
    const onAbort = () => setAnalytics(previous => ({ ...previous, error: "报表读取超时，可重新读取。", loading: false }));
    controller.signal.addEventListener("abort", onAbort, { once: true });
    return () => { controller.signal.removeEventListener("abort", onAbort); controller.abort(); clearTimeout(timeout); clearTimeout(firstSyncTimer); };
  }, [days, reload]);
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    setOperations(previous => ({ ...previous, error: null, loading: true }));
    request<Operations>("/api/v1/admin/overview", controller.signal).then(data => { if (!controller.signal.aborted) setOperations({ data, error: null, loading: false }); }).catch(error => {
      if (!controller.signal.aborted) setOperations(previous => ({ ...previous, error: error.message, loading: false }));
    }).finally(() => clearTimeout(timeout));
    const onAbort = () => setOperations(previous => ({ ...previous, error: "本站数据读取超时，可重新读取。", loading: false }));
    controller.signal.addEventListener("abort", onAbort, { once: true });
    return () => { controller.signal.removeEventListener("abort", onAbort); controller.abort(); clearTimeout(timeout); };
  }, [reload]);
  async function refresh() {
    setRefreshing(true); setNotice("");
    try {
      const data = await request<DashboardAnalytics & { sync: string }>(`/api/v1/admin/analytics?days=${days}`, AbortSignal.timeout(30_000), "POST");
      setAnalytics({ data, error: null, loading: false });
      setNotice(data.sync === "recent" ? "距上次尝试不足 15 分钟，继续显示现有汇总。" : data.sync === "not_configured" ? "平台报表读取尚未连接。" : data.sources.some(source => source.error) ? "部分平台同步失败，已保留上次成功数据。" : "报表汇总已更新。");
    } catch (error) { setNotice(error instanceof Error && error.name !== "TimeoutError" ? error.message : "同步尚未完成，请稍后重新读取；已有汇总保持不变。"); }
    finally { setRefreshing(false); }
  }
  return <AdminDashboardView days={days} setDays={setDays} analytics={analytics} operations={operations} refresh={refresh} refreshing={refreshing} reload={() => setReload(value => value + 1)} notice={notice} />;
}
