import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { requestIdentity, GUEST_COOKIE } from "@/lib/account/identity";
import { loadState, saveState } from "@/lib/learning/storage";
import {
  answerPlacementQuestion,
  createPlacementSession,
  placementResult,
  restartPlacement,
  resumePlacement,
  submitPlacement,
} from "@/lib/placement/domain";
import {
  publicPlacementQuestion,
  trustedPlacementQuestion,
} from "@/lib/placement/questions";
import type { PlacementSession } from "@/lib/learning/domain";

async function owner() {
  const identity = await requestIdentity();
  if (identity.account) {
    return { id: `user:${identity.account.userId}`, fresh: false, account: identity.account };
  }
  const jar = await cookies();
  let id = jar.get(GUEST_COOKIE)?.value;
  let fresh = false;
  if (!id) {
    id = crypto.randomUUID();
    fresh = true;
  }
  return { id, fresh, account: undefined };
}

const short = (value: unknown, max = 120) =>
  typeof value === "string" && value.length > 0 && value.length <= max
    ? value
    : undefined;

function sessionView(session: PlacementSession) {
  return {
    ...session,
    questions: session.questionIds.map((id) => {
      const question = trustedPlacementQuestion(id);
      if (!question) throw new Error("PLACEMENT_QUESTION_NOT_FOUND");
      return publicPlacementQuestion(question);
    }),
  };
}

function response(
  req: NextRequest,
  data: unknown,
  identity: Awaited<ReturnType<typeof owner>>,
  status = 200,
) {
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

export async function GET(req: NextRequest) {
  const identity = await owner();
  if (identity.account?.status === "deleted") {
    return response(req, { error: "ACCOUNT_DELETED" }, identity, 403);
  }
  const loaded = await loadState(identity.id);
  const resultId = short(req.nextUrl.searchParams.get("resultId"), 160);
  if (resultId) {
    const result = placementResult(loaded.state, identity.id, resultId);
    return result
      ? response(req, { result, scope: identity.account ? "account" : "guest" }, identity)
      : response(req, { error: "PLACEMENT_RESULT_NOT_FOUND" }, identity, 404);
  }
  const active = resumePlacement(loaded.state, identity.id);
  return response(req, {
    session: active ? sessionView(active) : null,
    scope: identity.account ? "account" : "guest",
    revision: loaded.revision,
  }, identity);
}

export async function POST(req: NextRequest) {
  const identity = await owner();
  if (identity.account?.status === "deleted") {
    return response(req, { error: "ACCOUNT_DELETED" }, identity, 403);
  }
  let body: Record<string, unknown>;
  try {
    const text = await req.text();
    if (text.length > 4096) {
      return response(req, { error: "PAYLOAD_TOO_LARGE" }, identity, 413);
    }
    body = JSON.parse(text) as Record<string, unknown>;
  } catch {
    return response(req, { error: "INVALID_JSON" }, identity, 400);
  }

  const action = short(body.action, 40);
  const payload = (body.payload && typeof body.payload === "object")
    ? body.payload as Record<string, unknown>
    : {};
  const idempotencyKey = short(payload.idempotencyKey, 100);
  if (!action || !idempotencyKey) {
    return response(req, { error: "INVALID_PLACEMENT_REQUEST" }, identity, 422);
  }

  for (let turn = 0; turn < 3; turn += 1) {
    const loaded = await loadState(identity.id);
    try {
      const now = new Date().toISOString();
      let nextState = loaded.state;
      let data: Record<string, unknown>;
      if (action === "start") {
        const created = createPlacementSession(nextState, {
          ownerId: identity.id,
          idempotencyKey,
          now,
        });
        nextState = created.state;
        data = { session: sessionView(created.session) };
      } else if (action === "answer") {
        const sessionId = short(payload.sessionId, 160);
        const questionId = short(payload.questionId, 120);
        const answer = short(payload.answer, 8);
        const question = questionId ? trustedPlacementQuestion(questionId) : undefined;
        if (!sessionId || !question || !answer || !Object.hasOwn(question.options, answer)) {
          throw new Error("INVALID_PLACEMENT_ANSWER");
        }
        const updated = answerPlacementQuestion(nextState, {
          sessionId,
          questionId: question.id,
          answer,
          idempotencyKey,
          now,
        });
        if (updated.session.ownerId !== identity.id) throw new Error("PLACEMENT_SESSION_NOT_FOUND");
        nextState = updated.state;
        data = { session: sessionView(updated.session) };
      } else if (action === "submit") {
        const sessionId = short(payload.sessionId, 160);
        if (!sessionId) throw new Error("PLACEMENT_SESSION_NOT_FOUND");
        const session = loaded.state.placementSessions?.find((entry) => entry.id === sessionId);
        if (!session || session.ownerId !== identity.id) throw new Error("PLACEMENT_SESSION_NOT_FOUND");
        const submitted = submitPlacement(nextState, { sessionId, idempotencyKey, now });
        nextState = submitted.state;
        data = { result: submitted.result };
      } else if (action === "restart") {
        const previousSessionId = short(payload.previousSessionId, 160);
        if (!previousSessionId) throw new Error("PLACEMENT_SESSION_NOT_FOUND");
        const restarted = restartPlacement(nextState, {
          ownerId: identity.id,
          previousSessionId,
          idempotencyKey,
          now,
        });
        nextState = restarted.state;
        data = { session: sessionView(restarted.session) };
      } else {
        return response(req, { error: "INVALID_ACTION" }, identity, 422);
      }
      const changed = nextState !== loaded.state;
      if (changed) await saveState(identity.id, nextState, loaded.revision);
      return response(req, {
        ...data,
        scope: identity.account ? "account" : "guest",
        revision: loaded.revision + (changed ? 1 : 0),
      }, identity, action === "start" ? 201 : 200);
    } catch (error) {
      const code = error instanceof Error ? error.message : "PLACEMENT_SAVE_FAILED";
      if (code === "REVISION_CONFLICT" && turn < 2) continue;
      const status = code === "ACCOUNT_DELETED"
        ? 403
        : code === "PLACEMENT_SESSION_NOT_FOUND" || code === "PLACEMENT_RESULT_NOT_FOUND"
          ? 404
          : code === "REVISION_CONFLICT"
            ? 409
            : 422;
      return response(req, { error: code }, identity, status);
    }
  }
  return response(req, { error: "REVISION_CONFLICT" }, identity, 409);
}
