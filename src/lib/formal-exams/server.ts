import { cookies } from "next/headers";
import { GUEST_COOKIE, requestIdentity } from "../account/identity";
import { resolveCapabilities } from "../commercial/storage";
import { mayOpenPaper } from "./domain";
import type { Form } from "./types";

export async function formalIdentity(createGuest = false) {
  const identity = await requestIdentity();
  if (identity.account) {
    if (identity.account.status !== "active") throw new Error("ACCOUNT_UNAVAILABLE");
    return { id: `user:${identity.account.userId}`, fresh: false, authenticated: true };
  }
  const guest = (await cookies()).get(GUEST_COOKIE)?.value;
  return { id: guest ?? (createGuest ? crypto.randomUUID() : ""), fresh: !guest && createGuest, authenticated: false };
}
export async function requirePaperAccess(form: Form, identity: Awaited<ReturnType<typeof formalIdentity>>) {
  if (form === "a") return;
  if (!identity.authenticated) throw new Error("SIGN_IN_REQUIRED");
  const access = await resolveCapabilities(identity.id);
  if (!mayOpenPaper(form, access.tier)) throw new Error("PRO_REQUIRED");
}
