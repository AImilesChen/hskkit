import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { requestIdentity, GUEST_COOKIE } from "@/lib/account/identity";
import type { PlacementSession } from "@/lib/learning/domain";
import { learningRewardLocalDay } from "@/lib/engagement/storage";
import { loadPlacementState, savePlacementState } from "@/lib/placement/storage";
import {
  answerPlacementQuestion,
  createPlacementSession,
  expiredPlacement,
  placementResult,
  placementSessionExpiresAt,
  restartPlacement,
  resumePlacement,
  submitPlacement,
} from "@/lib/placement/domain";
import { publicPlacementQuestion, trustedPlacementQuestion } from "@/lib/placement/questions";
import { d1UnavailableResponse, userD1RetryAfterSeconds, withUserD1ReadProtection } from "@/lib/d1/user-protection";

export type PlacementAction = "start" | "answer" | "submit" | "restart";

type PlacementOwner = {
  id: string;
  fresh: boolean;
  account: Awaited<ReturnType<typeof requestIdentity>>["account"];
};

async function owner(): Promise<PlacementOwner> {
  const identity = await requestIdentity();
  if (identity.account) return { id: `user:${identity.account.userId}`, fresh: false, account: identity.account };
  const jar = await cookies();
  let id = jar.get(GUEST_COOKIE)?.value;
  let fresh = false;
  if (!id) {
    id = crypto.randomUUID();
    fresh = true;
  }
  return { id, fresh, account: undefined };
}

export const shortPlacementValue = (value: unknown, max = 120) =>
  typeof value === "string" && value.length > 0 && value.length <= max ? value : undefined;

export async function placementBody(req: NextRequest) {
  const text = await req.text();
  if (text.length > 4096) throw new Error("PAYLOAD_TOO_LARGE");
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error("INVALID_JSON");
  }
}

function sessionView(session: PlacementSession) {
  const questions = session.questionIds.map((id) => {
    const question = trustedPlacementQuestion(id, session.questionVersion);
    if (!question) throw new Error("PLACEMENT_QUESTION_NOT_FOUND");
    return publicPlacementQuestion(question);
  });
  if (questions.length === 0) throw new Error("PLACEMENT_NO_QUESTIONS");
  return { ...session, expiresAt: placementSessionExpiresAt(session), questions };
}

function response(req: NextRequest, data: unknown, identity: PlacementOwner, status = 200) {
  const result = NextResponse.json(data, { status });
  if (identity.fresh) {
    result.cookies.set(GUEST_COOKIE, identity.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: req.nextUrl.protocol === "https:",
      maxAge: 31_536_000,
      path: "/",
    });
  }
  return result;
}

function unavailableOrThrow(error: unknown) {
  const unavailable = d1UnavailableResponse(error);
  if (unavailable) return unavailable;
  throw error;
}

function placementLoadUnavailableOrThrow(error: unknown) {
  const unavailable = d1UnavailableResponse(error, userD1RetryAfterSeconds());
  if (unavailable) return unavailable;
  throw error;
}

export function placementStatus(code: string) {
  if (code === "ACCOUNT_DELETED") return 403;
  if (code === "PLACEMENT_SESSION_NOT_FOUND" || code === "PLACEMENT_RESULT_NOT_FOUND") return 404;
  if (code === "PLACEMENT_SESSION_EXPIRED") return 410;
  if (code === "PLACEMENT_NO_QUESTIONS" || code === "PLACEMENT_CONTENT_VERSION_MISMATCH") return 503;
  if (code === "PAYLOAD_TOO_LARGE") return 413;
  if (code === "INVALID_JSON") return 400;
  if (code === "REVISION_CONFLICT") return 409;
  return 422;
}

export async function placementFailure(req: NextRequest, code: string) {
  try {
    const identity = await owner();
    return response(req, { error: code }, identity, placementStatus(code));
  } catch (error) {
    return unavailableOrThrow(error);
  }
}

async function getPlacementSessionInner(req: NextRequest) {
  const identity = await owner();
  if (identity.account?.status === "deleted") return response(req, { error: "ACCOUNT_DELETED" }, identity, 403);
  const loaded = await loadPlacementState(identity.id);
  const now = new Date().toISOString();
  const active = resumePlacement(loaded.state, identity.id, now);
  const expired = active ? undefined : expiredPlacement(loaded.state, identity.id, now);
  return response(req, {
    session: active ? sessionView(active) : null,
    expired: Boolean(expired),
    scope: identity.account ? "account" : "guest",
    revision: loaded.revision,
  }, identity);
}

export async function getPlacementSession(req: NextRequest) {
  try {
    return await withUserD1ReadProtection(() => getPlacementSessionInner(req));
  } catch (error) {
    return placementLoadUnavailableOrThrow(error);
  }
}

async function getPlacementResultInner(req: NextRequest, resultId: string) {
  const identity = await owner();
  if (identity.account?.status === "deleted") return response(req, { error: "ACCOUNT_DELETED" }, identity, 403);
  const loaded = await loadPlacementState(identity.id);
  const result = placementResult(loaded.state, identity.id, resultId);
  return result
    ? response(req, { result, scope: identity.account ? "account" : "guest" }, identity)
    : response(req, { error: "PLACEMENT_RESULT_NOT_FOUND" }, identity, 404);
}

export async function getPlacementResult(req: NextRequest, resultId: string) {
  try {
    return await withUserD1ReadProtection(() => getPlacementResultInner(req, resultId));
  } catch (error) {
    return unavailableOrThrow(error);
  }
}

async function runPlacementActionInner(req: NextRequest, action: PlacementAction, payload: Record<string, unknown>) {
  const identity = await owner();
  if (identity.account?.status === "deleted") return response(req, { error: "ACCOUNT_DELETED" }, identity, 403);
  const idempotencyKey = shortPlacementValue(payload.idempotencyKey, 100);
  if (!idempotencyKey) return response(req, { error: "INVALID_PLACEMENT_REQUEST" }, identity, 422);

  for (let turn = 0; turn < 3; turn += 1) {
    const loaded = await loadPlacementState(identity.id, { initializeIfMissing: action === "start" });
    try {
      const now = new Date().toISOString();
      let nextState = loaded.state;
      let data: Record<string, unknown>;
      if (action === "start") {
        const created = createPlacementSession(nextState, { ownerId: identity.id, idempotencyKey, now });
        nextState = created.state;
        data = { session: sessionView(created.session) };
      } else if (action === "answer") {
        const sessionId = shortPlacementValue(payload.sessionId, 160);
        const questionId = shortPlacementValue(payload.questionId, 120);
        const answer = shortPlacementValue(payload.answer, 8);
        const session = sessionId ? loaded.state.placementSessions?.find((entry) => entry.id === sessionId && entry.ownerId === identity.id) : undefined;
        const question = session && questionId ? trustedPlacementQuestion(questionId, session.questionVersion) : undefined;
        if (!session || !question || !answer || !Object.hasOwn(question.options, answer)) throw new Error("INVALID_PLACEMENT_ANSWER");
        const updated = answerPlacementQuestion(nextState, { sessionId: session.id, questionId: question.id, answer, idempotencyKey, now });
        nextState = updated.state;
        data = { session: sessionView(updated.session) };
      } else if (action === "submit") {
        const sessionId = shortPlacementValue(payload.sessionId, 160);
        const session = sessionId ? loaded.state.placementSessions?.find((entry) => entry.id === sessionId && entry.ownerId === identity.id) : undefined;
        if (!session) throw new Error("PLACEMENT_SESSION_NOT_FOUND");
        const submitted = submitPlacement(nextState, { sessionId: session.id, idempotencyKey, now });
        nextState = submitted.state;
        data = { result: submitted.result };
      } else {
        const previousSessionId = shortPlacementValue(payload.previousSessionId, 160);
        if (!previousSessionId) throw new Error("PLACEMENT_SESSION_NOT_FOUND");
        const restarted = restartPlacement(nextState, { ownerId: identity.id, previousSessionId, idempotencyKey, now });
        nextState = restarted.state;
        data = { session: sessionView(restarted.session) };
      }
      const changed = nextState !== loaded.state;
      const engagementActivity = action === "submit" && identity.account
        ? { localDay: await learningRewardLocalDay(identity.id, identity.account.timezone || "UTC"), action: "placement_submit", idempotencyKey }
        : undefined;
      await savePlacementState(identity.id, loaded.state, nextState, loaded.revision, engagementActivity, action === "submit");
      return response(req, {
        ...data,
        scope: identity.account ? "account" : "guest",
        revision: loaded.revision + (changed ? 1 : 0),
      }, identity, action === "start" ? 201 : 200);
    } catch (error) {
      const unavailable = d1UnavailableResponse(error);
      if (unavailable) return unavailable;
      const code = error instanceof Error ? error.message : "PLACEMENT_SAVE_FAILED";
      if (code === "REVISION_CONFLICT" && turn < 2) continue;
      return response(req, { error: code }, identity, placementStatus(code));
    }
  }
  return response(req, { error: "REVISION_CONFLICT" }, identity, 409);
}

export async function runPlacementAction(req: NextRequest, action: PlacementAction, payload: Record<string, unknown>) {
  try {
    return await runPlacementActionInner(req, action, payload);
  } catch (error) {
    return unavailableOrThrow(error);
  }
}
