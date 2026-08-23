import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ACCOUNT_COOKIE, SESSION_COOKIE } from "@/lib/account/identity";
import { revokeAccountSession } from "@/lib/account/storage";


export async function POST(request: Request) {
  const jar = await cookies();
  await revokeAccountSession(jar.get(SESSION_COOKIE)?.value);
  const response = NextResponse.redirect(new URL("/login?logout=success", request.url), 303);
  response.cookies.delete(SESSION_COOKIE);
  response.cookies.delete(ACCOUNT_COOKIE);
  return response;
}
