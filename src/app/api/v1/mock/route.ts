import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { GUEST_COOKIE, requestIdentity } from "@/lib/account/identity";
import { loadState, saveState } from "@/lib/learning/storage";
import { evaluateMockGate, mockBank, publicMockSession, saveMockAnswer, startMock, submitMock, type MockBand } from "@/lib/mock/domain";
import { applyMockResultToLearning } from "@/lib/mock/learning";
import { createMockSession, discardMockSession, findMockByStartKey, loadMockSession, recentMockExposure, saveMockProgress, saveMockSubmission } from "@/lib/mock/storage";
import { d1UnavailableResponse, withUserD1ReadProtection } from "@/lib/d1/user-protection";

async function owner() {
  const identity = await requestIdentity();
  if (identity.account) return { id: `user:${identity.account.userId}`, fresh: false, account: identity.account };
  const jar = await cookies();
  let id = jar.get(GUEST_COOKIE)?.value;
  let fresh = false;
  if (!id) { id = crypto.randomUUID(); fresh = true; }
  return { id, fresh, account: undefined };
}
const short = (value: unknown, max = 180) => typeof value === "string" && value.length > 0 && value.length <= max ? value : undefined;
const band = (value: unknown): MockBand | undefined => value === "basic" || value === "advanced" ? value : undefined;
const errorStatus = (code: string) => code === "MOCK_SESSION_NOT_FOUND" ? 404
  : code === "MOCK_TIME_EXPIRED" ? 410
    : code === "REVISION_CONFLICT" || code === "IDEMPOTENCY_KEY_REUSED" || code === "MOCK_ALREADY_SUBMITTED" ? 409
      : code.endsWith("_GATE") || code === "MOCK_NOT_READY" ? 503
        : 422;
function response(req: NextRequest, data: unknown, identity: Awaited<ReturnType<typeof owner>>, status = 200) {
  const result = NextResponse.json(data, { status });
  if (identity.fresh) result.cookies.set(GUEST_COOKIE, identity.id, { httpOnly: true, sameSite: "lax", secure: req.nextUrl.protocol === "https:", maxAge: 31_536_000, path: "/" });
  return result;
}
async function persistLearning(ownerId: string, result: ReturnType<typeof submitMock>["result"]) {
  for (let turn = 0; turn < 3; turn += 1) {
    const loaded = await loadState(ownerId);
    const state = applyMockResultToLearning(loaded.state, result);
    if (state === loaded.state) return;
    try { await saveState(ownerId, state, loaded.revision); return; }
    catch (error) {
      if (!(error instanceof Error) || error.message !== "REVISION_CONFLICT" || turn === 2) throw error;
    }
  }
}

async function getMock(req: NextRequest) {
  const sessionId = short(req.nextUrl.searchParams.get("sessionId"));
  if (!sessionId) {
    const availability = (requestedBand: MockBand, targetLevel?: number) => {
      const questions = mockBank(requestedBand, targetLevel);
      return evaluateMockGate(requestedBand, questions, targetLevel);
    };
    const basicLevels = Object.fromEntries([1, 2, 3, 4, 5, 6].map((level) => [level, availability("basic", level)]));
    const [basic, advanced] = [basicLevels[3], availability("advanced")];
    return NextResponse.json(
      { availability: { basic, basicLevels, advanced } },
      { headers: { "cache-control": "public, max-age=300, s-maxage=3600" } },
    );
  }
  const identity = await owner();
  const session = await loadMockSession(identity.id, sessionId);
  if (!session) return response(req, { error: "MOCK_SESSION_NOT_FOUND" }, identity, 404);
  return response(req, { session: publicMockSession(session), scope: identity.account ? "account" : "guest" }, identity);
}

export async function GET(req: NextRequest) {
  try {
    return await withUserD1ReadProtection(() => getMock(req));
  } catch (error) {
    const unavailable = d1UnavailableResponse(error);
    if (unavailable) return unavailable;
    throw error;
  }
}

async function postMock(req: NextRequest) {
  const identity = await owner();
  let body: Record<string, unknown>;
  try {
    const text = await req.text();
    if (text.length > 4096) return response(req, { error: "PAYLOAD_TOO_LARGE" }, identity, 413);
    body = JSON.parse(text) as Record<string, unknown>;
  } catch { return response(req, { error: "INVALID_JSON" }, identity, 400); }
  const action = short(body.action, 30);
  const payload = body.payload && typeof body.payload === "object" ? body.payload as Record<string, unknown> : {};
  const idempotencyKey = short(payload.idempotencyKey, 120);
  if (!action || !idempotencyKey) return response(req, { error: "INVALID_MOCK_REQUEST" }, identity, 422);
  try {
    if (action === "start") {
      const requestedBand = band(payload.band);
      if (!requestedBand) throw new Error("INVALID_MOCK_BAND");
      const targetLevel = requestedBand === "basic" ? payload.targetLevel : undefined;
      if (requestedBand === "basic" && (typeof targetLevel !== "number" || !Number.isInteger(targetLevel) || targetLevel < 1 || targetLevel > 6)) throw new Error("INVALID_MOCK_LEVEL");
      const prior = await findMockByStartKey(identity.id, requestedBand, idempotencyKey);
      if (prior) return response(req, { session: publicMockSession(prior), scope: identity.account ? "account" : "guest" }, identity);
      const recent = await recentMockExposure(identity.id, requestedBand, targetLevel as number | undefined);
      const session = await createMockSession(startMock({ band: requestedBand, ownerId: identity.id, idempotencyKey, now: new Date().toISOString(), targetLevel: targetLevel as number | undefined, recentQuestionIds: recent.questionIds, recentGroupIds: recent.groupIds }));
      return response(req, { session: publicMockSession(session), scope: identity.account ? "account" : "guest" }, identity, 201);
    }
    const sessionId = short(payload.sessionId);
    if (!sessionId) throw new Error("INVALID_MOCK_REQUEST");
    const session = await loadMockSession(identity.id, sessionId);
    if (action === "discard" && !session) return response(req, { discarded: true }, identity);
    if (!session) throw new Error("MOCK_SESSION_NOT_FOUND");
    if (action === "discard") {
      if (session.status !== "in_progress") throw new Error("MOCK_ALREADY_SUBMITTED");
      await discardMockSession(session, session.revision);
      return response(req, { discarded: true }, identity);
    }
    if (action === "answer") {
      const questionId = short(payload.questionId, 160);
      const answer = short(payload.answer, 180);
      if (!questionId || !answer) throw new Error("INVALID_MOCK_ANSWER");
      const updated = saveMockAnswer(session, { questionId, answer, idempotencyKey, now: new Date().toISOString() });
      if (updated !== session) await saveMockProgress(updated, session.revision);
      return response(req, { session: publicMockSession(updated), autosaved: true }, identity);
    }
    if (action === "submit") {
      const submitted = submitMock(session, { idempotencyKey, now: new Date().toISOString() });
      const durable = session.status === "submitted" ? session : await saveMockSubmission(submitted.session, session.revision);
      if (!durable.result) throw new Error("MOCK_RESULT_REQUIRED");
      await persistLearning(identity.id, durable.result);
      return response(req, { session: publicMockSession(durable), result: durable.result }, identity);
    }
    return response(req, { error: "INVALID_ACTION" }, identity, 422);
  } catch (error) {
    const unavailable = d1UnavailableResponse(error);
    if (unavailable) return unavailable;
    const code = error instanceof Error ? error.message : "MOCK_REQUEST_FAILED";
    return response(req, { error: code }, identity, errorStatus(code));
  }
}

export async function POST(req: NextRequest) {
  try {
    return await postMock(req);
  } catch (error) {
    const unavailable = d1UnavailableResponse(error);
    if (unavailable) return unavailable;
    throw error;
  }
}
