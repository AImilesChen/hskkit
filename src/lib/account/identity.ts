import { cookies } from "next/headers";
import { cache } from "react";
import { authenticateAccount, authenticateSession, type Account } from "./storage";
import { withUserD1ReadProtection } from "@/lib/d1/user-protection";

export const ACCOUNT_COOKIE = "hskkit_account";
export const SESSION_COOKIE = "hskkit_session";
export const GUEST_COOKIE = "hskkit_guest";
export const OAUTH_STATE_COOKIE = "hskkit_oauth_state";
export const OAUTH_VERIFIER_COOKIE = "hskkit_oauth_verifier";
export const OAUTH_RETURN_COOKIE = "hskkit_oauth_return";

export type AccountConnection = "google" | "sync_key";
type RequestIdentity = {
  account?: Account;
  sessionToken?: string;
  syncKey?: string;
  guestId?: string;
  connection?: AccountConnection;
};

const resolveRequestIdentity = cache(async function resolveRequestIdentity(touchSession: boolean): Promise<RequestIdentity> {
  return withUserD1ReadProtection(async () => {
  const jar = await cookies();
  const sessionToken = jar.get(SESSION_COOKIE)?.value;
  const sessionAccount = await authenticateSession(sessionToken, touchSession);
  if (sessionAccount) {
    return {
      account: sessionAccount,
      sessionToken,
      guestId: jar.get(GUEST_COOKIE)?.value,
      connection: "google",
    };
  }
  const syncKey = jar.get(ACCOUNT_COOKIE)?.value;
  const account = await authenticateAccount(syncKey, touchSession);
  return {
    account,
    syncKey: account ? syncKey : undefined,
    guestId: jar.get(GUEST_COOKIE)?.value,
    connection: account ? "sync_key" : undefined,
  };
  });
});

export function requestIdentity(options: { touchSession?: boolean } = {}) {
  return resolveRequestIdentity(Boolean(options.touchSession));
}

export const accountOwnerId = (userId: string) => `user:${userId}`;
