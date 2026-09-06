import { adminError, adminJson, requireAdmin } from "@/lib/admin/access";
import { parseListQuery } from "@/lib/admin/domain";
import { listAdminSubscriptions } from "@/lib/admin/repository";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { const { env } = await requireAdmin(); const url = new URL(request.url); const options = { ...parseListQuery(url.searchParams), status: url.searchParams.get("status") || undefined, access: url.searchParams.get("plan") || undefined, mode: url.searchParams.get("mode") || undefined }; return adminJson(await listAdminSubscriptions(env.LEARNING_DB, options)); } catch (error) { return adminError(error); } }
