import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { requestIdentity, GUEST_COOKIE } from "@/lib/account/identity";
import { loadState, saveState } from "@/lib/learning/storage";
import { answerPracticeQuestion, createPracticeSession, publicPracticeSession, reportPracticeQuestion, selectPracticeSession } from "@/lib/practice/domain";
import { practiceQuestionLifecycle, trustedPracticeQuestion } from "@/lib/practice/questions";
import { learningRewardLocalDay } from "@/lib/engagement/storage";
import { assertCurrentDailySession, type LearningState } from "@/lib/learning/domain";
import { learningLocalDay } from "@/lib/learning/progress";

async function owner() {
  const identity = await requestIdentity();
  if (identity.account) return { id: `user:${identity.account.userId}`, fresh: false, account: identity.account };
  const jar = await cookies();
  let id = jar.get(GUEST_COOKIE)?.value;
  let fresh = false;
  if (!id) { id = crypto.randomUUID(); fresh = true; }
  return { id, fresh, account: undefined };
}
const short = (value: unknown, max = 120) => typeof value === "string" && value.length > 0 && value.length <= max ? value : undefined;
const level = (value: unknown) => Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 9 ? Number(value) : undefined;
const offset = (value: unknown) => Number.isFinite(Number(value)) ? Math.max(-840, Math.min(840, Math.round(Number(value)))) : 0;
function assertCurrentDailyPracticeBinding(state: LearningState, ownerId: string, dailySessionId: string | undefined, dailyItemId: string | undefined, now: string, offsetMinutes: number, accountTimezone?: string) {
  if (!dailySessionId && !dailyItemId) return;
  if (!dailySessionId || !dailyItemId) throw new Error("INVALID_DAILY_PRACTICE_BINDING");
  const localDay = learningLocalDay(now, offsetMinutes, accountTimezone);
  const current = state.dailySessions.find((candidate) => candidate.ownerId === ownerId && candidate.localDay === localDay);
  try {
    assertCurrentDailySession(current, dailySessionId);
  } catch {
    throw new Error("PRACTICE_DAILY_SESSION_STALE");
  }
}
const errorStatus = (code: string) => code === "ACCOUNT_DELETED" ? 403
  : code === "PRACTICE_SESSION_NOT_FOUND" ? 404
    : code === "PRACTICE_SESSION_EXPIRED" || code === "PRACTICE_QUESTION_WITHDRAWN" || code === "PRACTICE_DAILY_SESSION_STALE" ? 410
      : code === "REVISION_CONFLICT" ? 409
        : 422;
function response(req: NextRequest, data: unknown, identity: Awaited<ReturnType<typeof owner>>, status = 200) {
  const result = NextResponse.json(data, { status });
  if (identity.fresh) result.cookies.set(GUEST_COOKIE, identity.id, { httpOnly: true, sameSite: "lax", secure: req.nextUrl.protocol === "https:", maxAge: 31_536_000, path: "/" });
  return result;
}

export async function GET(req: NextRequest) {
  const identity = await owner();
  if (identity.account?.status === "deleted") return response(req, { error: "ACCOUNT_DELETED" }, identity, 403);
  const requestedLevel = level(req.nextUrl.searchParams.get("level"));
  const skill = short(req.nextUrl.searchParams.get("skill"), 40);
  const dailySessionId = short(req.nextUrl.searchParams.get("dailySessionId"), 180);
  const dailyItemId = short(req.nextUrl.searchParams.get("dailyItemId"), 180);
  if (!requestedLevel || !skill) return response(req, { error: "INVALID_PRACTICE_REQUEST" }, identity, 422);
  const loaded = await loadState(identity.id);
  const now = new Date().toISOString();
  try {
    assertCurrentDailyPracticeBinding(loaded.state, identity.id, dailySessionId, dailyItemId, now, offset(req.nextUrl.searchParams.get("tzOffset")), identity.account?.timezone);
    const session = selectPracticeSession(loaded.state, { ownerId: identity.id, level: requestedLevel, skill, dailySessionId, dailyItemId }, now);
    return response(req, { session: session ? publicPracticeSession(session, now) : null, scope: identity.account ? "account" : "guest", revision: loaded.revision }, identity);
  } catch (error) {
    const code = error instanceof Error ? error.message : "PRACTICE_LOAD_FAILED";
    return response(req, { error: code }, identity, errorStatus(code));
  }
}

export async function POST(req: NextRequest) {
  const identity = await owner();
  if (identity.account?.status === "deleted") return response(req, { error: "ACCOUNT_DELETED" }, identity, 403);
  let body: Record<string, unknown>;
  try {
    const text = await req.text();
    if (text.length > 4096) return response(req, { error: "PAYLOAD_TOO_LARGE" }, identity, 413);
    body = JSON.parse(text) as Record<string, unknown>;
  } catch { return response(req, { error: "INVALID_JSON" }, identity, 400); }
  const action = short(body.action, 40);
  const payload = body.payload && typeof body.payload === "object" ? body.payload as Record<string, unknown> : {};
  const idempotencyKey = short(payload.idempotencyKey, 100);
  if (!action || !idempotencyKey) return response(req, { error: "INVALID_PRACTICE_REQUEST" }, identity, 422);
  const key = idempotencyKey;
  const tz = offset(body.tzOffset);

  for (let turn = 0; turn < 3; turn += 1) {
    const loaded = await loadState(identity.id);
    try {
      const now = new Date().toISOString();
      let state = loaded.state;
      let data: Record<string, unknown>;
      let dailyCompletion: { dailySessionId: string; dailyItemId: string; summaryComplete: boolean } | undefined;
      if (action === "start") {
        const requestedLevel = level(payload.level);
        const skill = short(payload.skill, 40);
        if (!requestedLevel || !skill) throw new Error("INVALID_PRACTICE_REQUEST");
        const dailySessionId = short(payload.dailySessionId, 180);
        const dailyItemId = short(payload.dailyItemId, 180);
        assertCurrentDailyPracticeBinding(state, identity.id, dailySessionId, dailyItemId, now, tz, identity.account?.timezone);
        const created = createPracticeSession(state, { ownerId: identity.id, level: requestedLevel, skill, idempotencyKey: key, now, dailySessionId, dailyItemId });
        state = created.state;
        data = { session: publicPracticeSession(created.session, now) };
      } else if (action === "answer") {
        const sessionId = short(payload.sessionId, 180);
        const questionId = short(payload.questionId, 140);
        const answer = short(payload.answer, 8);
        if (questionId && practiceQuestionLifecycle(questionId) === "withdrawn") throw new Error("PRACTICE_QUESTION_WITHDRAWN");
        const question = questionId ? trustedPracticeQuestion(questionId) : undefined;
        if (!sessionId || !question || !answer || !Object.hasOwn(question.options, answer)) throw new Error("INVALID_PRACTICE_ANSWER");
        const practiceSession = state.practiceSessions?.find((candidate) => candidate.id === sessionId && candidate.ownerId === identity.id);
        assertCurrentDailyPracticeBinding(state, identity.id, practiceSession?.dailySessionId, practiceSession?.dailyItemId, now, tz, identity.account?.timezone);
        const updated = answerPracticeQuestion(state, { ownerId: identity.id, sessionId, questionId: question.id, answer, idempotencyKey: key, now });
        state = updated.state;
        if (updated.session.status === "completed" && practiceSession?.dailySessionId && practiceSession.dailyItemId) {
          const dailySession = state.dailySessions.find((candidate) => candidate.id === practiceSession.dailySessionId);
          const dailyItem = dailySession?.items.find((item) => item.id === practiceSession.dailyItemId);
          if (dailySession && dailyItem?.status === "completed") dailyCompletion = {
            dailySessionId: dailySession.id,
            dailyItemId: dailyItem.id,
            summaryComplete: dailySession.items.some((item) => item.kind === "summary" && item.status === "completed"),
          };
        }
        data = { session: publicPracticeSession(updated.session, now), feedback: updated.feedback };
      } else if (action === "report") {
        const sessionId = short(payload.sessionId, 180);
        const questionId = short(payload.questionId, 140);
        const reason = short(payload.reason, 80);
        if (!sessionId || !questionId || !reason) throw new Error("INVALID_QUESTION_REPORT");
        const reported = reportPracticeQuestion(state, { ownerId: identity.id, sessionId, questionId, reason, idempotencyKey: key, now });
        state = reported.state;
        data = { report: reported.report };
      } else {
        return response(req, { error: "INVALID_ACTION" }, identity, 422);
      }
      const changed = state !== loaded.state;
      const engagementActivity = changed && action === "answer" && identity.account
        ? { localDay: await learningRewardLocalDay(identity.id, identity.account.timezone || "UTC"), action: "practice_answer", idempotencyKey: key }
        : undefined;
      if (changed) await saveState(identity.id, state, loaded.revision, undefined, undefined, undefined, engagementActivity);
      const revision = loaded.revision + (changed ? 1 : 0);
      return response(req, { ...data, ...(dailyCompletion ? { dailyCompletion: { ...dailyCompletion, revision } } : {}), scope: identity.account ? "account" : "guest", revision }, identity, action === "start" ? 201 : 200);
    } catch (error) {
      const code = error instanceof Error ? error.message : "PRACTICE_SAVE_FAILED";
      if (code === "REVISION_CONFLICT" && turn < 2) continue;
      return response(req, { error: code }, identity, errorStatus(code));
    }
  }
  return response(req, { error: "REVISION_CONFLICT" }, identity, 409);
}
