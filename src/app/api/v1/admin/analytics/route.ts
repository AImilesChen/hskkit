import { adminError, adminJson, requireAdmin, requireAdminSameOrigin } from "@/lib/admin/access";
import { parseReportDays } from "@/lib/admin/analytics-model";
import { readAnalytics, syncAnalytics } from "@/lib/admin/analytics-storage";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { env } = await requireAdmin();
    return adminJson(await readAnalytics(env, parseReportDays(new URL(request.url).searchParams.get("days"))));
  } catch (error) { return adminError(error); }
}

export async function POST(request: Request) {
  try {
    const { env } = await requireAdmin();
    requireAdminSameOrigin(request);
    const days = parseReportDays(new URL(request.url).searchParams.get("days"));
    const sync = await syncAnalytics(env, days);
    return adminJson({ ...await readAnalytics(env, days), sync: sync.state }, { status: sync.state === "busy" ? 409 : 200 });
  } catch (error) { return adminError(error); }
}
