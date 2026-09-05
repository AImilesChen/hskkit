import { redirect } from "next/navigation";
import { accountOwnerId, requestIdentity } from "@/lib/account/identity";
import { learningEntryDestination } from "@/lib/learning/dashboard";
import { loadState } from "@/lib/learning/storage";

export const dynamic = "force-dynamic";

export default async function StartLearningPage() {
  const identity = await requestIdentity();
  if (!identity.account) redirect(learningEntryDestination(false, {}));
  const loaded = await loadState(accountOwnerId(identity.account.userId));
  redirect(learningEntryDestination(true, loaded.state));
}