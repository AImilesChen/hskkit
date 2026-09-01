import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { requestIdentity, GUEST_COOKIE } from "@/lib/account/identity";
import { accessDecision } from "@/lib/account/access-policy";
import { getTrustedTopicPracticeQuestions } from "@/lib/topics/server";
import { publicTopicPracticeQuestion } from "@/lib/topics/practice";

type Props = { params: Promise<{ slug: string }> };

async function owner() {
  const identity = await requestIdentity();
  if (identity.account) return { id: `user:${identity.account.userId}`, fresh: false, account: identity.account };
  const jar = await cookies();
  let id = jar.get(GUEST_COOKIE)?.value;
  let fresh = false;
  if (!id) { id = crypto.randomUUID(); fresh = true; }
  return { id, fresh, account: undefined };
}

function response(req: NextRequest, data: unknown, identity: Awaited<ReturnType<typeof owner>>, status = 200) {
  const result = NextResponse.json(data, { status });
  if (identity.fresh) result.cookies.set(GUEST_COOKIE, identity.id, {
    httpOnly: true, sameSite: "lax", secure: req.nextUrl.protocol === "https:", maxAge: 31_536_000, path: "/",
  });
  return result;
}

export async function GET(req: NextRequest, { params }: Props) {
  const identity = await owner();
  const access = accessDecision({ accountStatus: identity.account?.status ?? "guest", permission: "learning:read" });
  if (!access.allowed) return response(req, { error: access.code }, identity, 403);
  const trusted = await getTrustedTopicPracticeQuestions((await params).slug);
  if (!trusted) return response(req, { error: "TOPIC_PRACTICE_UNAVAILABLE" }, identity, 503);
  return response(req, {
    topic: { slug: trusted.topic.slug, title: trusted.topic.title, titleZh: trusted.topic.titleZh },
    questions: trusted.questions.map(publicTopicPracticeQuestion),
    scope: identity.account ? "account" : "guest",
  }, identity);
}
