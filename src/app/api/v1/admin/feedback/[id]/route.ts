import { adminError, adminJson, readAdminJson, requireAdmin, requireAdminSameOrigin } from "@/lib/admin/access";
import { validateFeedbackReview } from "@/lib/admin/domain";
import { reviewFeedback } from "@/lib/admin/repository";
export const dynamic = "force-dynamic";
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { try { requireAdminSameOrigin(request); const { env, userId } = await requireAdmin(); const input = validateFeedbackReview(await readAdminJson(request)); const { id } = await params; return adminJson(await reviewFeedback(env.LEARNING_DB, id, input, userId)); } catch (error) { return adminError(error); } }
