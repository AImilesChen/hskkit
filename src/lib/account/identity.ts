import { cookies } from "next/headers";
import { authenticateAccount, authenticateSession, type Account } from "./storage";

export const ACCOUNT_COOKIE = "hskkit_account";
export const SESSION_COOKIE = "hskkit_session";
export const GUEST_COOKIE = "hskkit_guest";
export const OAUTH_STATE_COOKIE = "hskkit_oauth_state";
export const OAUTH_VERIFIER_COOKIE = "hskkit_oauth_verifier";

export type AccountConnection = "google" | "sync_key";

export async function requestIdentity(): Promise<{
  account?: Account;
  sessionToken?: string;
  syncKey?: string;
  guestId?: string;
  connection?: AccountConnection;
}> {
  const jar = await cookies();
  const sessionToken = jar.get(SESSION_COOKIE)?.value;
  const sessionAccount = await authenticateSession(sessionToken);
  if (sessionAccount) {
    return {
      account: sessionAccount,
      sessionToken,
      guestId: jar.get(GUEST_COOKIE)?.value,
      connection: "google",
    };
  }
  const syncKey = jar.get(ACCOUNT_COOKIE)?.value;
  const account = await authenticateAccount(syncKey);
  return {
    account,
    syncKey: account ? syncKey : undefined,
    guestId: jar.get(GUEST_COOKIE)?.value,
    connection: account ? "sync_key" : undefined,
  };
}

export const accountOwnerId = (userId: string) => `user:${userId}`;
