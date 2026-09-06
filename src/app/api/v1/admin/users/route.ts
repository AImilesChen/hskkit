import { adminError, adminJson, requireAdmin } from "@/lib/admin/access";
import { parseListQuery } from "@/lib/admin/domain";
import { listAdminUsers } from "@/lib/admin/repository";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { const { env } = await requireAdmin(); const url = new URL(request.url); const options = { ...parseListQuery(url.searchParams), status: url.searchParams.get("status") || undefined, access: url.searchParams.get("access") || undefined }; return adminJson(await listAdminUsers(env.LEARNING_DB, options)); } catch (error) { return adminError(error); } }
