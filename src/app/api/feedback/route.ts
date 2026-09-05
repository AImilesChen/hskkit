import { getCloudflareContext } from "@opennextjs/cloudflare";
import { sendFeedbackEmail, hashFeedbackIp } from "@/lib/feedback/email";
import { handleFeedbackRequest } from "@/lib/feedback/request";

export async function POST(request: Request) {
  const env = getCloudflareContext().env;
  return handleFeedbackRequest(request, {
    db: env.LEARNING_DB,
    hashIp: (ip) => hashFeedbackIp(ip, env.FEEDBACK_HASH_SECRET || ""),
    notify: (feedback) => sendFeedbackEmail(env.FEEDBACK_EMAIL, env.FEEDBACK_TO_EMAIL || "", feedback),
  });
}
