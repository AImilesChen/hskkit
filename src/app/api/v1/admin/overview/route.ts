import { adminError, adminJson, requireAdmin } from "@/lib/admin/access";
import { getAdminOverview } from "@/lib/admin/repository";
export const dynamic = "force-dynamic";
export async function GET() { try { const { env } = await requireAdmin(); return adminJson(await getAdminOverview(env.LEARNING_DB)); } catch (error) { return adminError(error); } }
