import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  buildDailySession,
  applyDailyItemAction,

  gradeReview,
  markAudioReviewReady,
  recordAttempt,
  recordAudioAttempt,
  type LearningState,
} from "../../../../lib/learning/domain";
import { audioPlaybackSubject, trustedAudioExercise, trustedTodayAudioExercise, type AudioMode } from "../../../../lib/learning/audio";
import { advancedListeningBySlug, isStep7AnswerAllowed, normalizeStep7Answer, trustedStep7Exercise } from "../../../../lib/learning/step7-content";
import { completeStep7PlaybackTicket, consumeStep7PlaybackTicket, createStep7PlaybackTicket } from "../../../../lib/learning/step7-playback";
import { trustedQuestion } from "../../../../lib/learning/questions";
import { requestIdentity, GUEST_COOKIE } from "../../../../lib/account/identity";
import { loadState, saveState } from "../../../../lib/learning/storage";
import { selectTodayContent, todayContentByContentId } from "../../../../lib/learning/today-content";
import { accessDecision, createAuditEvent, errorContract } from "../../../../lib/account/access-policy";
import { recordPolicyAudit } from "../../../../lib/account/audit-storage";

const COOKIE = GUEST_COOKIE;
async function owner() {
  const identity = await requestIdentity();
  if (identity.account) return { id: `user:${identity.account.userId}`, fresh: false, account: identity.account };
  const jar = await cookies();
  let id = jar.get(COOKIE)?.value;
  let fresh = false;
  if (!id) { id = crypto.randomUUID(); fresh = true; }
  return { id, fresh, account: undefined };
}
const short = (value: unknown, max = 100) => typeof value === "string" && value.length > 0 && value.length <= max ? value : undefined;
const offset = (value: unknown) => Number.isInteger(value) && Number(value) >= -840 && Number(value) <= 840 ? Number(value) : 0;
const errorResponse = (code: string, status: number, extra: Record<string, unknown> = {}) => NextResponse.json({ ...errorContract(code), ...extra }, { status });
async function requireLearningAccess(identity: Awaited<ReturnType<typeof owner>>, permission: "learning:read" | "learning:write") {
  const decision = accessDecision({ accountStatus: identity.account?.status ?? "guest", permission });
  if (!decision.allowed) {
    await recordPolicyAudit(createAuditEvent({ subjectId: identity.id, action: permission, resourceType: "learning", resourceId: identity.id, result: "denied", idempotencyKey: `${permission}:${crypto.randomUUID()}` }));
  }
  return decision;
}
function audioExercise(assetId: string, mode: AudioMode) {
  return trustedAudioExercise(assetId, mode) ?? trustedTodayAudioExercise(assetId, mode);
}
function assertDailyAudioBinding(state: LearningState, dailySessionId: string | undefined, dailyItemId: string | undefined, exercise: NonNullable<ReturnType<typeof audioExercise>>) {
  if (!dailySessionId && !dailyItemId) return;
  const session = dailySessionId ? state.dailySessions.find((candidate) => candidate.id === dailySessionId) : undefined;
  const item = session && dailyItemId ? session.items.find((candidate) => candidate.id === dailyItemId) : undefined;
  const firstPending = session?.items.find((candidate) => candidate.status === "pending");
  if (!session || !item || firstPending?.id !== item.id || item.kind !== "listen" || item.contentId !== exercise.contentId || item.contentVersion !== exercise.contentVersion || item.dimension !== exercise.dimension) {
    throw new Error("DAILY_ITEM_MISMATCH");
  }
}
function localDay(now: string, offsetMinutes: number) {
  return new Date(new Date(now).getTime() - offsetMinutes * 60_000).toISOString().slice(0, 10);
}
function view(state: LearningState, ownerId: string, offsetMinutes: number) {
  const now = new Date().toISOString();
  const latestPlacement = [...(state.placementResults ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const startLevel = latestPlacement?.recommendedLevel ?? 1;
  const built = buildDailySession(state, { ownerId, localDay: localDay(now, offsetMinutes), ruleVersion: "today-v4", now, dailyContent: selectTodayContent(startLevel) });
  const cards = built.state.cards.map((card) => {
    const attempt = built.state.attempts.find((candidate) => candidate.id === card.sourceAttemptId);
    const question = attempt?.contentId.startsWith("question:") ? trustedQuestion(attempt.contentId.slice(9)) : undefined;
    const assetId = attempt?.contentId.startsWith("word:") ? attempt.contentId.slice(5) : undefined;
    const todayItem = attempt?.contentId.startsWith("catalog:") ? todayContentByContentId(attempt.contentId) : undefined;
    const listeningSlug = attempt?.contentId.startsWith("listening:") ? attempt.contentId.slice(10) : undefined;
    const advancedListening = listeningSlug ? trustedStep7Exercise(`exercise:listening:${listeningSlug}`) : undefined;
    const audio = card.dimension !== "reading"
      ? (assetId ? trustedAudioExercise(assetId, card.dimension as AudioMode) : todayItem ? trustedTodayAudioExercise(todayItem.assetId, card.dimension as AudioMode) : undefined)
      : undefined;
    return {
      ...card,
      prompt: attempt?.prompt ?? (question ? `${question.question_cn} — ${question.question_en}` : audio?.prompt ?? advancedListening?.prompt ?? card.contentId),
      correctAnswer: attempt?.correctAnswerText ?? (question?.options[question.correct_answer] ?? audio?.options[audio.correctAnswer] ?? advancedListening?.correctAnswer ?? attempt?.correctAnswer ?? ""),
      userAnswer: attempt?.userAnswerText ?? (question && attempt ? question.options[attempt.answer] ?? attempt.answer : audio && attempt ? audio.options[attempt.answer] ?? attempt.answer : attempt?.answer ?? ""),
      audioText: audio?.voiceText ?? (listeningSlug ? advancedListeningBySlug(listeningSlug)?.voiceText : undefined),
      assetId: assetId ?? todayItem?.assetId,
      playbackReady: card.dimension === "reading" || Boolean(built.state.audioReviewReady?.some((ready) => ready.cardId === card.id && ready.cardRevision === card.revision)),
    };
  });
  const mistakes = built.state.mistakes.map((mistake) => {
    const attempt = built.state.attempts.find((candidate) => candidate.id === mistake.sourceAttemptId);
    return { ...mistake, dimension: attempt?.dimension ?? "reading", prompt: attempt?.prompt ?? mistake.contentId };
  });
  const mastery = {
    reading: built.state.cards.filter((card) => card.dimension === "reading").length,
    audio: built.state.cards.filter((card) => card.dimension === "audio").length,
    context_audio: built.state.cards.filter((card) => card.dimension === "context_audio").length,
  };
  return { state: built.state, session: built.session, cards, mistakes, mastery };
}
function response(data: ReturnType<typeof view>, fresh: boolean, id: string, revision: number, account = false, feedback?: { correct: boolean; correctAnswerText: string }) {
  const res = NextResponse.json({ session: data.session, cards: data.cards, mistakes: data.mistakes, mastery: data.mastery, revision, scope: account ? "account" : "guest", ...(feedback ? { feedback } : {}) });
  if (fresh) res.cookies.set(COOKIE, id, { httpOnly: true, sameSite: "lax", secure: true, maxAge: 31_536_000, path: "/" });
  return res;
}
export async function GET(req: NextRequest) {
  const identity = await owner();
  const access = await requireLearningAccess(identity, "learning:read");
  if (!access.allowed) return errorResponse(access.code, 403);
  const loaded = await loadState(identity.id);
  const tz = offset(req.nextUrl.searchParams.get("tzOffset") ? Number(req.nextUrl.searchParams.get("tzOffset")) : 0);
  const data = view(loaded.state, identity.id, tz);
  return response(data, identity.fresh, identity.id, loaded.revision, Boolean(identity.account));
}
export async function POST(req: NextRequest) {
  const identity = await owner();
  const access = await requireLearningAccess(identity, "learning:write");
  if (!access.allowed) return errorResponse(access.code, 403);
  let body: any;
  try {
    const text = await req.text();
    if (text.length > 4096) return errorResponse("PAYLOAD_TOO_LARGE", 413);
    body = JSON.parse(text);
  } catch {
    return errorResponse("INVALID_JSON", 400);
  }
  const action = body?.action;
  const payload = body?.payload ?? {};
  const tz = offset(body?.tzOffset);
  const key = short(payload.idempotencyKey, 80);
  if (!key) return errorResponse("INVALID_IDEMPOTENCY_KEY", 422);

  if (action === "audio_review_playback_start" || action === "audio_review_playback_complete") {
    const cardId = short(payload.cardId, 120);
    const cardRevision = Number.isInteger(payload.cardRevision) ? Number(payload.cardRevision) : -1;
    try {
      const loaded = await loadState(identity.id);
      const card = view(loaded.state, identity.id, tz).cards.find((candidate) => candidate.id === cardId && candidate.revision === cardRevision);
      if (!card?.audioText || card.dimension === "reading") throw new Error("INVALID_AUDIO_REVIEW");
      const exerciseKey = `review:${card.id}:${card.revision}`;
      if (action === "audio_review_playback_start") {
        const ticket = await createStep7PlaybackTicket(identity.id, exerciseKey, card.audioText);
        return NextResponse.json({ playbackTicket: ticket.id, notBefore: ticket.notBefore, expiresAt: ticket.expiresAt }, { status: 201 });
      }
      const ticketId = short(payload.playbackTicket, 80);
      if (!ticketId) throw new Error("AUDIO_PLAYBACK_REQUIRED");
      await completeStep7PlaybackTicket(identity.id, exerciseKey, ticketId, key);
      return NextResponse.json({ state: "playback_verified" });
    } catch (error) {
      return errorResponse(error instanceof Error ? error.message : "AUDIO_PLAYBACK_INCOMPLETE", 422);
    }
  }

  if (action === "audio_playback_start" || action === "audio_playback_complete") {
    const assetId = short(payload.assetId, 80);
    const mode = payload.mode === "audio" || payload.mode === "context_audio" ? payload.mode as AudioMode : undefined;
    const exercise = assetId && mode ? audioExercise(assetId, mode) : undefined;
    const dailySessionId = short(payload.dailySessionId, 120);
    const dailyItemId = short(payload.dailyItemId, 220);
    if (!exercise) return errorResponse("INVALID_AUDIO_PLAYBACK", 422);
    try {
      const loaded = await loadState(identity.id);
      assertDailyAudioBinding(loaded.state, dailySessionId, dailyItemId, exercise);
      const exerciseKey = audioPlaybackSubject(exercise, dailySessionId, dailyItemId);
      if (action === "audio_playback_start") {
        const ticket = await createStep7PlaybackTicket(identity.id, exerciseKey, exercise.voiceText);
        const res = NextResponse.json({ playbackTicket: ticket.id, notBefore: ticket.notBefore, expiresAt: ticket.expiresAt }, { status: 201 });
        if (identity.fresh) res.cookies.set(COOKIE, identity.id, { httpOnly: true, sameSite: "lax", secure: true, maxAge: 31_536_000, path: "/" });
        return res;
      }
      const ticketId = short(payload.playbackTicket, 80);
      if (!ticketId) throw new Error("AUDIO_PLAYBACK_REQUIRED");
      await completeStep7PlaybackTicket(identity.id, exerciseKey, ticketId, key);
      const res = NextResponse.json({ state: "playback_verified" });
      if (identity.fresh) res.cookies.set(COOKIE, identity.id, { httpOnly: true, sameSite: "lax", secure: true, maxAge: 31_536_000, path: "/" });
      return res;
    } catch (error) {
      const code = error instanceof Error ? error.message : "AUDIO_PLAYBACK_INCOMPLETE";
      return errorResponse(code, code === "ACCOUNT_DELETED" ? 403 : 422);
    }
  }

  if (action === "step7_playback_start") {
    const exerciseId = short(payload.exerciseId, 120);
    const exercise = exerciseId ? trustedStep7Exercise(exerciseId) : undefined;
    const listening = exercise && (exercise.kind === "tone" || exercise.kind === "discrimination" || exercise.kind === "dictation");
    if (!exercise || !listening) return errorResponse("INVALID_STEP7_PLAYBACK", 422);
    const lesson = advancedListeningBySlug(exercise.contentId.slice("listening:".length));
    if (!lesson) return errorResponse("INVALID_STEP7_PLAYBACK", 422);
    const ticket = await createStep7PlaybackTicket(identity.id, exercise.id, lesson.voiceText);
    const res = NextResponse.json({ playbackTicket: ticket.id, notBefore: ticket.notBefore, expiresAt: ticket.expiresAt }, { status: 201 });
    if (identity.fresh) res.cookies.set(COOKIE, identity.id, { httpOnly: true, sameSite: "lax", secure: true, maxAge: 31_536_000, path: "/" });
    return res;
  }

  if (action === "step7_playback_complete") {
    const exerciseId = short(payload.exerciseId, 120);
    const ticketId = short(payload.playbackTicket, 80);
    const exercise = exerciseId ? trustedStep7Exercise(exerciseId) : undefined;
    const listening = exercise && (exercise.kind === "tone" || exercise.kind === "discrimination" || exercise.kind === "dictation");
    if (!exercise || !listening || !ticketId) return errorResponse("INVALID_STEP7_PLAYBACK", 422);
    try {
      await completeStep7PlaybackTicket(identity.id, exercise.id, ticketId, key);
      const res = NextResponse.json({ state: "playback_verified" });
      if (identity.fresh) res.cookies.set(COOKIE, identity.id, { httpOnly: true, sameSite: "lax", secure: true, maxAge: 31_536_000, path: "/" });
      return res;
    } catch (error) {
      const code = error instanceof Error ? error.message : "AUDIO_PLAYBACK_INCOMPLETE";
      return errorResponse(code, code === "ACCOUNT_DELETED" ? 403 : 422);
    }
  }

  for (let turn = 0; turn < 3; turn += 1) {
    const loaded = await loadState(identity.id);
    const dailyAction = action === "complete_item" || action === "skip_item" || action === "restore_item" || action === "configure_today";
    if (dailyAction && (loaded.state.dailyOperationKeys ?? []).includes(key)) {
      return response(view(loaded.state, identity.id, tz), identity.fresh, identity.id, loaded.revision, Boolean(identity.account));
    }
    if (dailyAction && Number.isInteger(body?.clientRevision) && body.clientRevision !== loaded.revision && !(loaded.state.dailyOperationKeys ?? []).includes(key)) {
      await recordPolicyAudit(createAuditEvent({ subjectId: identity.id, action: String(action), resourceType: "learning", resourceId: identity.id, result: "conflict", idempotencyKey: key, metadata: { serverRevision: loaded.revision, clientRevision: body.clientRevision } }));
      return errorResponse("REVISION_CONFLICT", 409, { state: "conflict", serverRevision: loaded.revision, clientRevision: body.clientRevision });
    }
    let state = view(loaded.state, identity.id, tz).state;
    let feedback: { correct: boolean; correctAnswerText: string } | undefined;
    try {
      if (action === "attempt") {
        const questionId = short(payload.questionId, 50);
        const answer = short(payload.answer, 8);
        const question = questionId ? trustedQuestion(questionId) : undefined;
        if (!question || !answer || !Object.hasOwn(question.options, answer)) throw new Error("INVALID_ATTEMPT");
        state = recordAttempt(state, {
          idempotencyKey: key,
          contentId: `question:${question.id}`,
          contentVersion: question.contentVersion,
          dimension: "reading",
          answer,
          correctAnswer: question.correct_answer,
          prompt: [question.passage_cn, question.passage_en, question.question_cn, question.question_en].filter(Boolean).join(" — "),
          userAnswerText: question.options[answer],
          correctAnswerText: question.options[question.correct_answer],
          observedAt: new Date().toISOString(),
        }).state;
      } else if (action === "step7_attempt") {
        const exerciseId = short(payload.exerciseId, 120);
        const rawAnswer = short(payload.answer, 160);
        const exercise = exerciseId ? trustedStep7Exercise(exerciseId) : undefined;
        if (!exercise || !rawAnswer || !isStep7AnswerAllowed(exercise, rawAnswer)) throw new Error("INVALID_STEP7_ATTEMPT");
        const listening = exercise.kind === "tone" || exercise.kind === "discrimination" || exercise.kind === "dictation";
        if (listening) {
          const ticketId = short(payload.playbackTicket, 80);
          if (!ticketId) throw new Error("AUDIO_PLAYBACK_REQUIRED");
          await consumeStep7PlaybackTicket(identity.id, exercise.id, ticketId, key);
        }
        const answer = normalizeStep7Answer(rawAnswer);
        const correctAnswer = normalizeStep7Answer(exercise.correctAnswer);
        if (!answer) throw new Error("INVALID_STEP7_ATTEMPT");
        const input = {
          idempotencyKey: key,
          contentId: exercise.contentId,
          contentVersion: exercise.contentVersion,
          dimension: listening ? "audio" as const : "reading" as const,
          answer,
          correctAnswer,
          prompt: exercise.prompt,
          userAnswerText: rawAnswer,
          correctAnswerText: exercise.options?.[exercise.correctAnswer] ?? exercise.correctAnswer,
          observedAt: new Date().toISOString(),
        };
        state = listening
          ? recordAudioAttempt(state, { ...input, dimension: "audio", playbackResult: "completed" }).state
          : recordAttempt(state, input).state;
      } else if (action === "audio_attempt") {
        const assetId = short(payload.assetId, 80);
        const mode = payload.mode === "audio" || payload.mode === "context_audio" ? payload.mode as AudioMode : undefined;
        const answer = short(payload.answer, 8);
        const exercise = assetId && mode ? audioExercise(assetId, mode) : undefined;
        if (!exercise || !answer || !Object.hasOwn(exercise.options, answer)) throw new Error("INVALID_AUDIO_ATTEMPT");
        const dailySessionId = short(payload.dailySessionId, 120);
        const dailyItemId = short(payload.dailyItemId, 220);
        assertDailyAudioBinding(state, dailySessionId, dailyItemId, exercise);
        const ticketId = short(payload.playbackTicket, 80);
        if (!ticketId) throw new Error("AUDIO_PLAYBACK_REQUIRED");
        await consumeStep7PlaybackTicket(identity.id, audioPlaybackSubject(exercise, dailySessionId, dailyItemId), ticketId, key);
        const recorded = recordAudioAttempt(state, {
          idempotencyKey: key,
          contentId: exercise.contentId,
          contentVersion: exercise.contentVersion,
          dimension: exercise.dimension,
          answer,
          correctAnswer: exercise.correctAnswer,
          prompt: exercise.prompt,
          userAnswerText: exercise.options[answer],
          correctAnswerText: exercise.options[exercise.correctAnswer],
          observedAt: new Date().toISOString(),
          playbackResult: "completed",
          mode: "listening",
          dailySessionId,
          dailyItemId,
        });
        if (!("attempt" in recorded)) throw new Error("AUDIO_PLAYBACK_REQUIRED");
        state = recorded.state;
        feedback = { correct: recorded.attempt.correct, correctAnswerText: exercise.options[exercise.correctAnswer] };
      } else if (action === "audio_review_ready") {
        const cardId = short(payload.cardId, 120);
        const playbackTicket = short(payload.playbackTicket, 80);
        if (!cardId || !Number.isInteger(payload.cardRevision) || !playbackTicket) throw new Error("INVALID_AUDIO_REVIEW");
        await consumeStep7PlaybackTicket(identity.id, `review:${cardId}:${payload.cardRevision}`, playbackTicket, key);
        state = markAudioReviewReady(state, cardId, payload.cardRevision, key);
      } else if (action === "grade") {
        if (!short(payload.cardId, 120) || !["again", "hard", "good", "easy"].includes(payload.grade) || !Number.isInteger(payload.clientRevision)) throw new Error("INVALID_GRADE");
        state = gradeReview(state, { cardId: payload.cardId, grade: payload.grade, idempotencyKey: key, observedAt: new Date().toISOString(), clientRevision: payload.clientRevision }).state;
      } else if (action === "complete_item" || action === "skip_item" || action === "restore_item") {
        if (!short(payload.sessionId, 120) || !short(payload.itemId, 160)) throw new Error("INVALID_ITEM");
        state = applyDailyItemAction(state, {
          sessionId: payload.sessionId,
          itemId: payload.itemId,
          action: action === "complete_item" ? "complete" : action === "skip_item" ? "skip" : "restore",
          idempotencyKey: key,
          observedAt: new Date().toISOString(),
        }).state;
      } else if (action === "configure_today") {
        if (!Number.isInteger(payload.budgetMinutes) || payload.budgetMinutes < 5 || payload.budgetMinutes > 180) throw new Error("INVALID_TIME_BUDGET");
        const observedAt = new Date().toISOString();
        const latestPlacement = [...(state.placementResults ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
        state = buildDailySession(state, { ownerId: identity.id, localDay: localDay(observedAt, tz), ruleVersion: "today-v4", now: observedAt, dailyContent: selectTodayContent(latestPlacement?.recommendedLevel ?? 1), budgetMinutes: payload.budgetMinutes }).state;
        state = { ...state, dailyOperationKeys: [...(state.dailyOperationKeys ?? []), key].slice(-400) };
      } else {
        return errorResponse("INVALID_ACTION", 422);
      }
      const data = view(state, identity.id, tz);
      await saveState(identity.id, data.state, loaded.revision, createAuditEvent({ subjectId: identity.id, action: String(action), resourceType: "learning", resourceId: data.session.id, result: "success", idempotencyKey: key, metadata: { revision: loaded.revision + 1 } }));
      return response(data, identity.fresh, identity.id, loaded.revision + 1, Boolean(identity.account), feedback);
    } catch (error) {
      const code = error instanceof Error ? error.message : "SAVE_FAILED";
      const replayable = action === "attempt" || action === "step7_attempt" || action === "audio_attempt" || action === "audio_review_ready" || dailyAction;
      if (code === "REVISION_CONFLICT" && replayable && turn < 2) continue;
      if (code === "REVISION_CONFLICT") await recordPolicyAudit(createAuditEvent({ subjectId: identity.id, action: String(action), resourceType: "learning", resourceId: identity.id, result: "conflict", idempotencyKey: key }));
      return errorResponse(code, code === "ACCOUNT_DELETED" ? 403 : code === "REVISION_CONFLICT" ? 409 : 422);
    }
  }
  return errorResponse("REVISION_CONFLICT", 409);
}
