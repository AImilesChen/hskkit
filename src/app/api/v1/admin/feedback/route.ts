import { adminError, adminJson, requireAdmin } from "@/lib/admin/access";
import { parseListQuery } from "@/lib/admin/domain";
import { listAdminFeedback } from "@/lib/admin/repository";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { const { env } = await requireAdmin(); const url = new URL(request.url); const options = { ...parseListQuery(url.searchParams), status: url.searchParams.get("status") || undefined, type: url.searchParams.get("type") || undefined }; return adminJson(await listAdminFeedback(env.LEARNING_DB, options)); } catch (error) { return adminError(error); } }
