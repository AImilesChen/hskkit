import { cookies } from "next/headers";
import { authenticateAccount, type Account } from "./storage";

export const ACCOUNT_COOKIE = "hskkit_account";
export const GUEST_COOKIE = "hskkit_guest";

export async function requestIdentity(): Promise<{ account?: Account; syncKey?: string; guestId?: string }> {
  const jar = await cookies();
  const syncKey = jar.get(ACCOUNT_COOKIE)?.value;
  const account = await authenticateAccount(syncKey);
  return { account, syncKey: account ? syncKey : undefined, guestId: jar.get(GUEST_COOKIE)?.value };
}

export const accountOwnerId = (userId: string) => `user:${userId}`;
