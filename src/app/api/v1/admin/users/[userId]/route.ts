import { adminError, adminJson, requireAdmin } from "@/lib/admin/access";
import { getAdminUser } from "@/lib/admin/repository";
export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: Promise<{ userId: string }> }) { try { const { env } = await requireAdmin(); const { userId } = await params; const result = await getAdminUser(env.LEARNING_DB, userId); return result ? adminJson(result) : adminJson({ error: "USER_NOT_FOUND" }, { status: 404 }); } catch (error) { return adminError(error); } }
