import { adminError, adminJson, readAdminJson, requireAdmin, requireAdminSameOrigin } from "@/lib/admin/access";
import { validateFeedbackRetention, validateFeedbackReview } from "@/lib/admin/domain";
import { deleteArchivedFeedback, reviewFeedback, setFeedbackRetention } from "@/lib/admin/repository";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    requireAdminSameOrigin(request);
    const { env, userId } = await requireAdmin();
    const input = await readAdminJson(request);
    const { id } = await params;
    if (input && typeof input === "object" && "retentionStatus" in input) {
      return adminJson(await setFeedbackRetention(env.LEARNING_DB, id, validateFeedbackRetention(input), userId));
    }
    return adminJson(await reviewFeedback(env.LEARNING_DB, id, validateFeedbackReview(input), userId));
  } catch (error) {
    return adminError(error);
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    requireAdminSameOrigin(request);
    const { env, userId } = await requireAdmin();
    const { id } = await params;
    return adminJson(await deleteArchivedFeedback(env.LEARNING_DB, id, userId));
  } catch (error) {
    return adminError(error);
  }
}
