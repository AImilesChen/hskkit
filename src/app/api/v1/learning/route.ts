import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  buildDailySession,
  completeDailyItem,
  gradeReview,
  markAudioReviewReady,
  recordAttempt,
  recordAudioAttempt,
  type LearningState,
} from "../../../../lib/learning/domain";
import { trustedAudioExercise, type AudioMode } from "../../../../lib/learning/audio";
import { trustedQuestion } from "../../../../lib/learning/questions";
import { requestIdentity, GUEST_COOKIE } from "../../../../lib/account/identity";
import { loadState, saveState } from "../../../../lib/learning/storage";

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
function localDay(now: string, offsetMinutes: number) {
  return new Date(new Date(now).getTime() - offsetMinutes * 60_000).toISOString().slice(0, 10);
}
function view(state: LearningState, ownerId: string, offsetMinutes: number) {
  const now = new Date().toISOString();
  const built = buildDailySession(state, { ownerId, localDay: localDay(now, offsetMinutes), ruleVersion: "today-v2", now });
  const cards = built.state.cards.map((card) => {
    const attempt = built.state.attempts.find((candidate) => candidate.id === card.sourceAttemptId);
    const question = attempt?.contentId.startsWith("question:") ? trustedQuestion(attempt.contentId.slice(9)) : undefined;
    const assetId = attempt?.contentId.startsWith("word:") ? attempt.contentId.slice(5) : undefined;
    const audio = assetId && card.dimension !== "reading" ? trustedAudioExercise(assetId, card.dimension as AudioMode) : undefined;
    return {
      ...card,
      prompt: attempt?.prompt ?? (question ? `${question.question_cn} — ${question.question_en}` : audio?.prompt ?? card.contentId),
      correctAnswer: attempt?.correctAnswerText ?? (question?.options[question.correct_answer] ?? audio?.options[audio.correctAnswer] ?? attempt?.correctAnswer ?? ""),
      userAnswer: attempt?.userAnswerText ?? (question && attempt ? question.options[attempt.answer] ?? attempt.answer : audio && attempt ? audio.options[attempt.answer] ?? attempt.answer : attempt?.answer ?? ""),
      audioText: audio?.voiceText,
      assetId,
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
function response(data: ReturnType<typeof view>, fresh: boolean, id: string, revision: number, account = false) {
  const res = NextResponse.json({ session: data.session, cards: data.cards, mistakes: data.mistakes, mastery: data.mastery, revision, scope: account ? "account" : "guest" });
  if (fresh) res.cookies.set(COOKIE, id, { httpOnly: true, sameSite: "lax", secure: true, maxAge: 31_536_000, path: "/" });
  return res;
}
export async function GET(req: NextRequest) {
  const identity = await owner();
  if (identity.account?.status === "deleted") return NextResponse.json({ error: "ACCOUNT_DELETED" }, { status: 403 });
  const loaded = await loadState(identity.id);
  const tz = offset(req.nextUrl.searchParams.get("tzOffset") ? Number(req.nextUrl.searchParams.get("tzOffset")) : 0);
  const data = view(loaded.state, identity.id, tz);
  const changed = data.state.dailySessions.length !== loaded.state.dailySessions.length;
  if (changed) {
    try {
      await saveState(identity.id, data.state, loaded.revision);
    } catch (error) {
      if (error instanceof Error && error.message === "ACCOUNT_DELETED") return NextResponse.json({ error: "ACCOUNT_DELETED" }, { status: 403 });
      throw error;
    }
  }
  return response(data, identity.fresh, identity.id, loaded.revision + (changed ? 1 : 0), Boolean(identity.account));
}
export async function POST(req: NextRequest) {
  const identity = await owner();
  if (identity.account?.status === "deleted") return NextResponse.json({ error: "ACCOUNT_DELETED" }, { status: 403 });
  let body: any;
  try {
    const text = await req.text();
    if (text.length > 4096) return NextResponse.json({ error: "PAYLOAD_TOO_LARGE" }, { status: 413 });
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }
  const action = body?.action;
  const payload = body?.payload ?? {};
  const tz = offset(body?.tzOffset);
  const key = short(payload.idempotencyKey, 80);
  if (!key) return NextResponse.json({ error: "INVALID_IDEMPOTENCY_KEY" }, { status: 422 });

  for (let turn = 0; turn < 3; turn += 1) {
    const loaded = await loadState(identity.id);
    let state = loaded.state;
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
      } else if (action === "audio_attempt") {
        const assetId = short(payload.assetId, 80);
        const mode = payload.mode === "audio" || payload.mode === "context_audio" ? payload.mode as AudioMode : undefined;
        const answer = short(payload.answer, 8);
        const exercise = assetId && mode ? trustedAudioExercise(assetId, mode) : undefined;
        if (!exercise || !answer || !Object.hasOwn(exercise.options, answer)) throw new Error("INVALID_AUDIO_ATTEMPT");
        state = recordAudioAttempt(state, {
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
        }).state;
      } else if (action === "audio_review_ready") {
        const cardId = short(payload.cardId, 120);
        if (!cardId || !Number.isInteger(payload.cardRevision)) throw new Error("INVALID_AUDIO_REVIEW");
        state = markAudioReviewReady(state, cardId, payload.cardRevision, key);
      } else if (action === "grade") {
        if (!short(payload.cardId, 120) || !["again", "hard", "good", "easy"].includes(payload.grade) || !Number.isInteger(payload.clientRevision)) throw new Error("INVALID_GRADE");
        state = gradeReview(state, { cardId: payload.cardId, grade: payload.grade, idempotencyKey: key, observedAt: new Date().toISOString(), clientRevision: payload.clientRevision }).state;
      } else if (action === "complete_item") {
        if (!short(payload.sessionId, 120) || !short(payload.itemId, 160)) throw new Error("INVALID_ITEM");
        state = completeDailyItem(state, payload.sessionId, payload.itemId).state;
      } else {
        return NextResponse.json({ error: "INVALID_ACTION" }, { status: 422 });
      }
      const data = view(state, identity.id, tz);
      await saveState(identity.id, data.state, loaded.revision);
      return response(data, identity.fresh, identity.id, loaded.revision + 1, Boolean(identity.account));
    } catch (error) {
      const code = error instanceof Error ? error.message : "SAVE_FAILED";
      const replayable = action === "attempt" || action === "audio_attempt" || action === "audio_review_ready" || action === "complete_item";
      if (code === "REVISION_CONFLICT" && replayable && turn < 2) continue;
      return NextResponse.json({ error: code }, { status: code === "ACCOUNT_DELETED" ? 403 : code === "REVISION_CONFLICT" ? 409 : 422 });
    }
  }
  return NextResponse.json({ error: "REVISION_CONFLICT" }, { status: 409 });
}
