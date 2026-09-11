import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { d1UnavailableResponse, withUserD1ReadProtection } from "@/lib/d1/user-protection";
import { createHash } from "node:crypto";

import {
  buildDailySession,
  applyDailyItemAction,
  assertTodayLearnItemMatches,
  assertCurrentDailySession,
  addWordToToday,
  addWordToReview,
  recordDictionarySearch,
  toggleSavedWord,

  gradeReview,
  isOpenMistakeForCard,
  undoLastReview,
  markAudioReviewReady,
  masterySnapshot,
  recordAttempt,
  recordAudioAttempt,
  type LearningState,
} from "../../../../lib/learning/domain";
import { isTodayBudgetMinutes, isTodayFocus, isTodayNewWordCount, recommendTodayNewWordCount } from "../../../../lib/learning/today-plan";
import { articleBySlug, articleQuestion } from "../../../../lib/learning/reading-articles";
import { audioPlaybackSubject, trustedAudioExercise, trustedTodayAudioExercise, type AudioMode } from "../../../../lib/learning/audio";
import { advancedListeningBySlug, isStep7AnswerAllowed, normalizeStep7Answer, trustedStep7Exercise } from "../../../../lib/learning/step7-content";
import { completeStep7PlaybackTicket, consumeStep7PlaybackTicket, createStep7PlaybackTicket } from "../../../../lib/learning/step7-playback";
import { trustedQuestion } from "../../../../lib/learning/questions";
import { requestIdentity, GUEST_COOKIE } from "../../../../lib/account/identity";
import { loadState, saveState, usageSnapshot, type ReferralLearningActivity, type UsageCharge } from "../../../../lib/learning/storage";
import { projectLearningHistory } from "../../../../lib/learning/projection";
import { resolveCapabilities } from "../../../../lib/commercial/storage";
import { type ProductCapabilities } from "../../../../lib/commercial/capabilities";
import { reconcileReferralLearningMilestone } from "../../../../lib/commercial/referral-storage";
import { learningRewardLocalDay } from "@/lib/engagement/storage";
import { selectTodayContent, todayContentByAssetId, todayContentByContentId, todayContentFromCatalogRow } from "../../../../lib/learning/today-content";
import { findPublicCatalogWordById, suggestPublicCatalogWords } from "../../../../lib/content/public-catalog-index";
import { accessDecision, createAuditEvent, errorContract } from "../../../../lib/account/access-policy";
import { recordPolicyAudit } from "../../../../lib/account/audit-storage";
import { computeSessionStreak } from "../../../../lib/account/domain";
import { computeOffsetSessionStreak, deriveHomeNextStep, learningLocalDay } from "../../../../lib/learning/progress";
import { checkReviewAnswer, reviewSnapshotFromStep7Exercise } from "../../../../lib/learning/review-content";
import { reviewLevelControl } from "../../../../lib/learning/review-session";
import { resolvedReviewSnapshotForAttempt } from "../../../../lib/learning/review-content-resolver";
import { getDictionaryLearningContext, getDictionaryWordsByIds } from "../../../../lib/dictionary/p2-server";
import { dictionaryWordProgress, resolveDictionaryPractice } from "../../../../lib/dictionary/p2-learning";
import { learningTopics } from "../../../../lib/topics/catalog";
import { getTrustedTopicPracticeQuestions, getVerifiedTopicForMutation } from "../../../../lib/topics/server";
import { answerTopicPracticeQuestion } from "../../../../lib/topics/practice";
import { recordTopicVisit, topicWordProgressFromState } from "../../../../lib/topics/progress";
import { publishedAudioDurationBySrc } from "../../../../lib/audio/assets";

const COOKIE = GUEST_COOKIE;
const queueBindingFor = (ownerId: string) => createHash("sha256").update(`hskkit-learning-queue:${ownerId}`).digest("base64url").slice(0, 24);
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
async function resolveTodayDictionaryItem(assetId: string) {
  const local = todayContentByAssetId(assetId);
  if (local) return local;
  const row = findPublicCatalogWordById(assetId);
  return row ? todayContentFromCatalogRow(row) : undefined;
}
const offset = (value: unknown) => Number.isInteger(value) && Number(value) >= -840 && Number(value) <= 840 ? Number(value) : 0;
const PRIVATE_RESPONSE_HEADERS = { "Cache-Control": "private, no-store" } as const;
const errorResponse = (code: string, status: number, extra: Record<string, unknown> = {}) => NextResponse.json({ ...errorContract(code), ...extra }, { status, headers: PRIVATE_RESPONSE_HEADERS });
async function requireLearningAccess(identity: Awaited<ReturnType<typeof owner>>, permission: "learning:read" | "learning:write") {
  const decision = accessDecision({ accountStatus: identity.account?.status ?? "guest", permission });
  if (!decision.allowed) {
    await recordPolicyAudit(createAuditEvent({ subjectId: identity.id, action: permission, resourceType: "learning", resourceId: identity.id, result: "denied", idempotencyKey: `${permission}:${crypto.randomUUID()}` }));
  }
  return decision;
}
function audioExercise(assetId: string, mode: AudioMode, dailyBound = false) {
  return dailyBound
    ? trustedTodayAudioExercise(assetId, mode)
    : trustedAudioExercise(assetId, mode) ?? trustedTodayAudioExercise(assetId, mode);
}
function assertDailyAudioBinding(state: LearningState, dailySessionId: string | undefined, dailyItemId: string | undefined, exercise: NonNullable<ReturnType<typeof audioExercise>>, currentDailySessionId?: string) {
  if (!dailySessionId && !dailyItemId) return;
  const session = dailySessionId ? state.dailySessions.find((candidate) => candidate.id === dailySessionId) : undefined;
  const item = session && dailyItemId ? session.items.find((candidate) => candidate.id === dailyItemId) : undefined;
  const firstPending = session?.items.find((candidate) => !candidate.deferred && candidate.status === "pending");
  if (dailySessionId !== currentDailySessionId || !session || !item || firstPending?.id !== item.id || item.kind !== "listen" || item.contentId !== exercise.contentId || item.contentVersion !== exercise.contentVersion || item.dimension !== exercise.dimension) {
    throw new Error("DAILY_ITEM_MISMATCH");
  }
}
function view(state: LearningState, ownerId: string, offsetMinutes: number, capabilities: ProductCapabilities, accountTimezone?: string) {
  const now = new Date().toISOString();
  const nextAction = deriveHomeNextStep(state, now);
  const latestPlacement = [...(state.placementResults ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const startLevel = state.preferredLearningLevel ?? latestPlacement?.recommendedLevel ?? 1;
  const localDay = learningLocalDay(now, offsetMinutes, accountTimezone);
  const prior = state.dailySessions.find((session) => session.ownerId === ownerId && session.localDay === localDay);
  const budgetMinutes = isTodayBudgetMinutes(prior?.budgetMinutes) ? prior.budgetMinutes : 20;
  const legacySingleWordPlan = prior?.ruleVersion === "today-v8" && prior.newWordCount === 1 && budgetMinutes >= 10;
  const savedPreferences = state.todayPreferences;
  const preferences = {
    newWordCount: legacySingleWordPlan ? recommendTodayNewWordCount(budgetMinutes) : savedPreferences?.newWordCount ?? recommendTodayNewWordCount(budgetMinutes),
    listeningEnabled: savedPreferences?.listeningEnabled ?? true,
    focus: savedPreferences?.focus ?? "balanced" as const,
  };
  const built = buildDailySession(state, { ownerId, localDay, ruleVersion: "today-v9", now, dailyContent: selectTodayContent(startLevel, preferences.newWordCount), budgetMinutes, ...preferences });
  const projected = projectLearningHistory(built.state, capabilities, new Date(now));
  const visibleCards = projected.cards;
  const cards = visibleCards.map((card) => {
    const attempt = built.state.attempts.find((candidate) => candidate.id === card.sourceAttemptId);
    const snapshot = attempt ? resolvedReviewSnapshotForAttempt(attempt) : undefined;
    const assetId = attempt?.contentId.startsWith("word:") ? attempt.contentId.slice(5) : undefined;
    const audio = card.dimension !== "reading" && assetId
      ? (trustedAudioExercise(assetId, card.dimension as AudioMode) ?? trustedTodayAudioExercise(assetId, card.dimension as AudioMode))
      : undefined;
    const vocabulary = audio?.word;
    const formalAudioSrc = snapshot?.audioSrc ?? (audio?.word.audio.status === "formal" ? audio.word.audio.src : undefined);
    const formalAudioText = snapshot?.audioText ?? audio?.voiceText;
    const playbackRequired = card.dimension !== "reading" && Boolean(formalAudioSrc && formalAudioText);
    const isMistake = isOpenMistakeForCard(built.state, card);
    return {
      ...card,
      prompt: snapshot?.prompt ?? attempt?.prompt ?? card.contentId,
      context: snapshot?.context,
      instruction: snapshot?.instruction,
      answerMode: snapshot?.answerMode ?? "self_recall",
      correctAnswer: snapshot?.correctAnswerText ?? attempt?.correctAnswerText ?? attempt?.correctAnswer ?? "",
      correctAnswerKey: snapshot?.correctAnswer ?? attempt?.correctAnswer ?? "",
      userAnswer: attempt?.userAnswerText ?? attempt?.answer ?? "",
      priorAnswerLabel: "Answer from your earlier practice",
      choices: snapshot?.options ? Object.entries(snapshot.options).map(([key, text]) => ({ key, text })) : [],
      isMistake,
      legacyReview: !snapshot,
      reviewReason: isMistake ? "You missed this in an earlier practice session." : card.reviewCount === 0 ? "This is your first scheduled memory check." : "This item is due now based on your previous review.",
      level: snapshot?.level,
      levelBand: snapshot?.levelBand ?? "Legacy",
      skill: snapshot?.skillLabel ?? (card.dimension === "reading" ? "Reading" : "Listening"),
      sourceGroupId: snapshot?.sourceGroupId,
      templateId: snapshot?.templateId,
      canonicalContentKey: snapshot?.canonicalContentKey ?? card.canonicalContentKey,
      topic: snapshot?.topic,
      explanation: snapshot?.explanation ?? "This older item does not contain a complete original question snapshot. Use it only as a memory prompt.",
      audioText: formalAudioText,
      audioSrc: formalAudioSrc,
      assetId,
      pinyin: vocabulary?.pinyin,
      meaning: vocabulary?.meaning,
      example: vocabulary?.example,
      formalAudioSrc,
      playbackRequired,
      playbackReady: !playbackRequired || Boolean(built.state.audioReviewReady?.some((ready) => ready.cardId === card.id && ready.cardRevision === card.revision)),
    };
  });
  const mistakes = projected.mistakes.map((mistake) => {
    const attempt = built.state.attempts.find((candidate) => candidate.id === mistake.sourceAttemptId);
    const dimension = attempt?.dimension ?? "reading";
    const mistakeCanonical = mistake.canonicalContentKey ?? attempt?.canonicalContentKey ?? attempt?.reviewSnapshot?.canonicalContentKey;
    const cardId = built.state.cards.find((card) => {
      if (card.dimension !== dimension) return false;
      if (mistakeCanonical && card.canonicalContentKey) return card.canonicalContentKey === mistakeCanonical;
      return card.contentId === mistake.contentId && card.contentVersion === mistake.contentVersion;
    })?.id;
    const snapshot = attempt ? resolvedReviewSnapshotForAttempt(attempt) : undefined;
    return { ...mistake, cardId, dimension, prompt: attempt?.prompt ?? mistake.contentId, level: snapshot?.level, skill: snapshot?.skillLabel ?? (dimension === "reading" ? "Reading" : "Listening") };
  });
  const mastery = masterySnapshot(built.state);
  const focusedReview = capabilities.focusedReview
    ? cards
      .filter((card) => card.dueAt <= now)
      .sort((a, b) => Number(b.isMistake) - Number(a.isMistake) || Number(b.dimension !== "reading") - Number(a.dimension !== "reading") || a.dueAt.localeCompare(b.dueAt))
      .map((card) => ({ ...card, focusReason: card.isMistake ? "open_mistake" as const : "due" as const }))
    : [];
  const dueReviewCards = capabilities.focusedReview ? focusedReview : cards.filter((card) => card.dueAt <= now);
  const reviewLevels = reviewLevelControl(dueReviewCards, startLevel, capabilities.focusedReview);
  const streak = accountTimezone
    ? computeSessionStreak(built.state.dailySessions, accountTimezone, now)
    : computeOffsetSessionStreak(built.state.dailySessions, offsetMinutes, now);
  const session = {
    ...built.session,
    items: built.session.items.map((item) => {
      if (item.kind !== "learn") return item;
      const dictionaryAssetId = item.id.startsWith("dictionary:") ? item.id.slice("dictionary:".length) : undefined;
      const learnContent = dictionaryAssetId ? todayContentByAssetId(dictionaryAssetId) : todayContentByContentId(item.contentId);
      return learnContent ? { ...item, learnContent } : item;
    }),
  };
  return {
    state: built.state,
    session,
    cards,
    mistakes,
    mastery,
    focusedReview,
    reviewLevelControl: reviewLevels,
    canUndoReview: built.state.lastReviewUndo ? { cardId: built.state.lastReviewUndo.cardId } : null,
    nextAction,
    streak,
    streakBasis: accountTimezone ? `Account timezone: ${accountTimezone}` : "This device's local day",
    currentLevel: startLevel,
    dueCount: built.state.cards.filter((card) => card.dueAt <= now).length,
    practiceQuestionsCompleted: (built.state.practiceSessions ?? [])
      .filter((practice) => practice.dailySessionId === session.id)
      .reduce((count, practice) => Math.max(count, practice.answers.length), 0),
  };
}
function response(data: ReturnType<typeof view>, fresh: boolean, id: string, revision: number, account: boolean, capabilities: ProductCapabilities, usage: { dailyNewItems: number; dailyReviewGrades: number }, feedback?: { correct: boolean; correctAnswerText: string; explanation?: string }, savedWords: Awaited<ReturnType<typeof getDictionaryWordsByIds>> = []) {
  const queueBinding = queueBindingFor(id);
  const dictionaryAssetIds = new Set<string>(data.state.savedWordIds ?? []);
  for (const card of data.state.cards) if (card.contentId.startsWith("word:")) dictionaryAssetIds.add(card.contentId.slice(5));
  for (const session of data.state.dailySessions) for (const item of session.items) if (item.id.startsWith("dictionary:")) dictionaryAssetIds.add(item.id.slice("dictionary:".length));
  const dictionaryProgress = Object.fromEntries([...dictionaryAssetIds].map((assetId) => [assetId, dictionaryWordProgress(data.state, assetId, new Date().toISOString())]));
  const topicAssetIds = [...new Set(learningTopics.flatMap((topic) => topic.wordAssetIds))];
  const topicProgress = Object.fromEntries(topicAssetIds.map((assetId) => [assetId, topicWordProgressFromState(data.state, assetId)]));
  const res = NextResponse.json({
    session: data.session,
    cards: data.cards,
    mistakes: data.mistakes,
    savedWordIds: data.state.savedWordIds ?? [],
    recentDictionarySearches: data.state.recentDictionarySearches ?? [],
    topicVisits: data.state.topicVisits ?? [],
    readingArticleProgress: data.state.readingArticleProgress ?? [],
    topicProgress,
    dictionaryProgress,
    savedWords,
    mastery: data.mastery,
    focusedReview: data.focusedReview,
    reviewLevelControl: data.reviewLevelControl,
    canUndoReview: data.canUndoReview,
    capabilities,
    usage,
    nextAction: data.nextAction,
    streak: data.streak,
    streakBasis: data.streakBasis,
    currentLevel: data.currentLevel,
    dueCount: data.dueCount,
    practiceQuestionsCompleted: data.practiceQuestionsCompleted,
    queueBinding,
    revision,
    scope: account ? "account" : "guest",
    ...(feedback ? { feedback } : {}),
  }, { headers: PRIVATE_RESPONSE_HEADERS });
  if (fresh) res.cookies.set(COOKIE, id, { httpOnly: true, sameSite: "lax", secure: true, maxAge: 31_536_000, path: "/" });
  return res;
}
async function getLearning(req: NextRequest) {
  const identity = await owner();
  const access = await requireLearningAccess(identity, "learning:read");
  if (!access.allowed) return errorResponse(access.code, 403);
  const loaded = await loadState(identity.id);
  const tz = offset(req.nextUrl.searchParams.get("tzOffset") ? Number(req.nextUrl.searchParams.get("tzOffset")) : 0);
  const capabilities = await resolveCapabilities(identity.id);
  const periodKey = learningLocalDay(new Date().toISOString(), tz, identity.account?.timezone);
  const usage = await usageSnapshot(identity.id, periodKey);
  const data = view(loaded.state, identity.id, tz, capabilities, identity.account?.timezone);
  const words = await getDictionaryWordsByIds(data.state.savedWordIds ?? []);
  return response(data, identity.fresh, identity.id, loaded.revision, Boolean(identity.account), capabilities, usage, undefined, words);
}
export async function GET(req: NextRequest) {
  try { return await withUserD1ReadProtection(() => getLearning(req)); }
  catch (error) { const unavailable = d1UnavailableResponse(error); if (unavailable) return unavailable; throw error; }
}
async function postLearning(req: NextRequest) {
  const identity = await owner();
  const access = await requireLearningAccess(identity, "learning:write");
  if (!access.allowed) return errorResponse(access.code, 403);
  let body: { queueBinding?: string; action?: string; payload?: Record<string, unknown>; tzOffset?: number; clientRevision?: number };
  try {
    const text = await req.text();
    if (text.length > 4096) return errorResponse("PAYLOAD_TOO_LARGE", 413);
    body = JSON.parse(text) as typeof body;
  } catch {
    return errorResponse("INVALID_JSON", 400);
  }
  if (body?.queueBinding && body.queueBinding !== queueBindingFor(identity.id)) return errorResponse("IDENTITY_CHANGED", 409);
  const action = body?.action;
  const payload = body?.payload ?? {};
  const tz = offset(body?.tzOffset);
  const key = short(payload.idempotencyKey, 80);
  if (!key) return errorResponse("INVALID_IDEMPOTENCY_KEY", 422);
  const topicAction = action === "touch_topic" || action === "topic_batch_today" || action === "topic_batch_review";
  if (topicAction && !identity.account) return errorResponse("ACCOUNT_REQUIRED", 403);
  const capabilities = await resolveCapabilities(identity.id);
  const periodKey = learningLocalDay(new Date().toISOString(), tz, identity.account?.timezone);
  let usage = await usageSnapshot(identity.id, periodKey);

  if (action === "audio_review_playback_start" || action === "audio_review_playback_complete") {
    const cardId = short(payload.cardId, 120);
    const cardRevision = Number.isInteger(payload.cardRevision) ? Number(payload.cardRevision) : -1;
    try {
      const loaded = await loadState(identity.id);
      const card = view(loaded.state, identity.id, tz, capabilities, identity.account?.timezone).cards.find((candidate) => candidate.id === cardId && candidate.revision === cardRevision);
      if (!card?.audioText || card.dimension === "reading") throw new Error("INVALID_AUDIO_REVIEW");
      const exerciseKey = `review:${card.id}:${card.revision}`;
      if (action === "audio_review_playback_start") {
        const trustedDuration = publishedAudioDurationBySrc(card.audioSrc);
        const ticket = await createStep7PlaybackTicket(identity.id, exerciseKey, card.audioText, new Date(), trustedDuration);
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
    const dailySessionId = short(payload.dailySessionId, 120);
    const dailyItemId = short(payload.dailyItemId, 220);
    const exercise = assetId && mode ? audioExercise(assetId, mode, Boolean(dailySessionId && dailyItemId)) : undefined;
    if (!exercise) return errorResponse("INVALID_AUDIO_PLAYBACK", 422);
    try {
      const loaded = await loadState(identity.id);
      const activeToday = view(loaded.state, identity.id, tz, capabilities, identity.account?.timezone);
      assertDailyAudioBinding(activeToday.state, dailySessionId, dailyItemId, exercise, activeToday.session.id);
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

  if (action === "dictionary_playback_start" || action === "dictionary_playback_complete") {
    const assetId = short(payload.assetId, 120);
    const context = assetId ? await getDictionaryLearningContext(assetId) : null;
    if (!context?.current.audioAsset) return errorResponse("INVALID_DICTIONARY_PLAYBACK", 422);
    const exerciseKey = `dictionary:${context.current.assetId}:listening`;
    try {
      if (action === "dictionary_playback_start") {
        const ticket = await createStep7PlaybackTicket(identity.id, exerciseKey, context.current.hanzi);
        const res = NextResponse.json({ playbackTicket: ticket.id, notBefore: ticket.notBefore, expiresAt: ticket.expiresAt }, { status: 201 });
        if (identity.fresh) res.cookies.set(COOKIE, identity.id, { httpOnly: true, sameSite: "lax", secure: true, maxAge: 31_536_000, path: "/" });
        return res;
      }
      const ticketId = short(payload.playbackTicket, 80);
      if (!ticketId) throw new Error("AUDIO_PLAYBACK_REQUIRED");
      await completeStep7PlaybackTicket(identity.id, exerciseKey, ticketId, key);
      return NextResponse.json({ state: "playback_verified" });
    } catch (error) {
      return errorResponse(error instanceof Error ? error.message : "AUDIO_PLAYBACK_INCOMPLETE", 422);
    }
  }

  if (action === "step7_playback_start") {
    const exerciseId = short(payload.exerciseId, 120);
    const exercise = exerciseId ? trustedStep7Exercise(exerciseId) : undefined;
    const listening = exercise && (exercise.kind === "tone" || exercise.kind === "discrimination" || exercise.kind === "dictation");
    if (!exercise || !listening) return errorResponse("INVALID_STEP7_PLAYBACK", 422);
    const lesson = advancedListeningBySlug(exercise.contentId.slice("listening:".length));
    if (!lesson?.audioAsset) return errorResponse("INVALID_STEP7_PLAYBACK", 422);
    const ticket = await createStep7PlaybackTicket(identity.id, exercise.id, lesson.voiceText, new Date(), lesson.audioAsset.durationSeconds);
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

  if (action === "topic_practice_playback_start" || action === "topic_practice_playback_complete") {
    const topicSlug = short(payload.topicSlug, 100);
    const questionId = short(payload.questionId, 160);
    const trusted = topicSlug ? await getTrustedTopicPracticeQuestions(topicSlug) : null;
    const question = trusted?.questions.find((candidate) => candidate.id === questionId && candidate.mode === "listening");
    if (!question?.audioAsset?.text || !question.audioAsset.src) return errorResponse("INVALID_TOPIC_PRACTICE_PLAYBACK", 422);
    try {
      if (action === "topic_practice_playback_start") {
        const ticket = await createStep7PlaybackTicket(identity.id, question.id, question.audioAsset.text);
        const res = NextResponse.json({ playbackTicket: ticket.id, notBefore: ticket.notBefore, expiresAt: ticket.expiresAt }, { status: 201 });
        if (identity.fresh) res.cookies.set(COOKIE, identity.id, { httpOnly: true, sameSite: "lax", secure: true, maxAge: 31_536_000, path: "/" });
        return res;
      }
      const ticketId = short(payload.playbackTicket, 80);
      if (!ticketId) throw new Error("AUDIO_PLAYBACK_REQUIRED");
      await completeStep7PlaybackTicket(identity.id, question.id, ticketId, key);
      return NextResponse.json({ state: "playback_verified" });
    } catch (error) {
      return errorResponse(error instanceof Error ? error.message : "AUDIO_PLAYBACK_INCOMPLETE", 422);
    }
  }

  for (let turn = 0; turn < 3; turn += 1) {
    const loaded = await loadState(identity.id);
    const readingProgressAction = action === "reading_article_progress" || action === "reading_article_word";
    const dailyAction = action === "complete_item" || action === "skip_item" || action === "restore_item" || action === "configure_today" || action === "save_word" || action === "add_to_today" || action === "add_to_review" || action === "dictionary_search" || action === "clear_dictionary_searches" || topicAction || readingProgressAction;
    if (dailyAction && (loaded.state.dailyOperationKeys ?? []).includes(key)) {
      return response(view(loaded.state, identity.id, tz, capabilities, identity.account?.timezone), identity.fresh, identity.id, loaded.revision, Boolean(identity.account), capabilities, usage);
    }
    if (action === "grade") {
      const replayCardId = short(payload.cardId, 120);
      const replayCard = replayCardId ? loaded.state.cards.find((card) => card.id === replayCardId) : undefined;
      if (replayCard?.gradeKeys.includes(key)) {
        return response(view(loaded.state, identity.id, tz, capabilities, identity.account?.timezone), identity.fresh, identity.id, loaded.revision, Boolean(identity.account), capabilities, usage);
      }
    }
    if (action === "retry_review") {
      const replayCardId = short(payload.cardId, 120);
      const replayCard = replayCardId ? loaded.state.cards.find((card) => card.id === replayCardId) : undefined;
      if (replayCard?.gradeKeys.includes(key)) {
        const attempt = loaded.state.attempts.find((candidate) => candidate.id === replayCard.sourceAttemptId);
        const snapshot = attempt ? resolvedReviewSnapshotForAttempt(attempt) : undefined;
        const replayGrade = replayCard.gradeResults?.[key];
        if (!replayGrade) return errorResponse("IDEMPOTENT_RESULT_UNAVAILABLE", 409);
        return response(view(loaded.state, identity.id, tz, capabilities, identity.account?.timezone), identity.fresh, identity.id, loaded.revision, Boolean(identity.account), capabilities, usage, snapshot ? { correct: replayGrade !== "again", correctAnswerText: snapshot.correctAnswerText } : undefined);
      }
    }
    if (dailyAction && Number.isInteger(body?.clientRevision) && body.clientRevision !== loaded.revision && !(loaded.state.dailyOperationKeys ?? []).includes(key)) {
      await recordPolicyAudit(createAuditEvent({ subjectId: identity.id, action: String(action), resourceType: "learning", resourceId: identity.id, result: "conflict", idempotencyKey: key, metadata: { serverRevision: loaded.revision, clientRevision: body.clientRevision } }));
      return errorResponse("REVISION_CONFLICT", 409, { state: "conflict", serverRevision: loaded.revision, clientRevision: body.clientRevision });
    }
    let state = view(loaded.state, identity.id, tz, capabilities, identity.account?.timezone).state;
    let feedback: { correct: boolean; correctAnswerText: string; explanation?: string } | undefined;
    let usageCharge: UsageCharge | undefined;
    let reviewCorrect: boolean | undefined;
    try {
      if (action === "reading_article_progress") {
        const articleSlug = short(payload.articleSlug, 120);
        const article = articleSlug ? articleBySlug(articleSlug) : undefined;
        if (!article) throw new Error("INVALID_READING_ARTICLE_PROGRESS");
        const now = new Date().toISOString();
        const prior = state.readingArticleProgress?.find((item) => item.slug === article.slug);
        const scrollPercent = Math.max(prior?.scrollPercent ?? 0, Math.min(100, Math.max(0, Number(payload.scrollPercent) || 0)));
        const answeredCount = Math.max(prior?.answeredCount ?? 0, Math.min(article.questions.length, Math.max(0, Number(payload.answeredCount) || 0)));
        const correctCount = Math.max(prior?.correctCount ?? 0, Math.min(answeredCount, Math.max(0, Number(payload.correctCount) || 0)));
        const completed = Boolean(payload.completed) || Boolean(prior?.completed);
        const favorite = typeof payload.favorite === "boolean" ? payload.favorite : prior?.favorite ?? false;
        const readingSeconds = Math.max(prior?.readingSeconds ?? 0, Math.min(86_400, Math.max(0, Number(payload.readingSeconds) || 0)));
        const nextProgress = {
          slug: article.slug,
          level: article.level,
          openedAt: prior?.openedAt ?? now,
          lastViewedAt: now,
          scrollPercent,
          completed,
          ...(completed ? { completedAt: prior?.completedAt ?? now } : {}),
          answeredCount,
          correctCount,
          ...(answeredCount ? { accuracy: Math.round((correctCount / answeredCount) * 100) } : {}),
          wordClickCount: prior?.wordClickCount ?? 0,
          reviewWordIds: prior?.reviewWordIds ?? [],
          favorite,
          readingSeconds,
          needsReview: answeredCount > 0 && correctCount < answeredCount,
        };
        state = {
          ...state,
          readingArticleProgress: [nextProgress, ...(state.readingArticleProgress ?? []).filter((item) => item.slug !== article.slug)].slice(0, 500),
          dailyOperationKeys: [...(state.dailyOperationKeys ?? []), key].slice(-400),
        };
      } else if (action === "reading_article_word") {
        const articleSlug = short(payload.articleSlug, 120);
        const hanzi = short(payload.hanzi, 20);
        const article = articleSlug ? articleBySlug(articleSlug) : undefined;
        const vocabulary = article && hanzi ? article.vocabulary.find((item) => item.hanzi === hanzi) : undefined;
        if (!article || !vocabulary) throw new Error("INVALID_READING_ARTICLE_WORD");
        const catalogWord = suggestPublicCatalogWords({ q: vocabulary.hanzi, level: article.level, limit: 4 }).find((item) => item.hanzi === vocabulary.hanzi);
        if (catalogWord) {
          const context = await getDictionaryLearningContext(catalogWord.id);
          if (context) state = addWordToReview(state, { word: context.current, observedAt: new Date().toISOString() });
        }
        const now = new Date().toISOString();
        const prior = state.readingArticleProgress?.find((item) => item.slug === article.slug);
        const reviewWordIds = catalogWord ? [...new Set([...(prior?.reviewWordIds ?? []), catalogWord.id])] : prior?.reviewWordIds ?? [];
        const nextProgress = {
          slug: article.slug,
          level: article.level,
          openedAt: prior?.openedAt ?? now,
          lastViewedAt: now,
          scrollPercent: prior?.scrollPercent ?? 0,
          completed: prior?.completed ?? false,
          ...(prior?.completedAt ? { completedAt: prior.completedAt } : {}),
          answeredCount: prior?.answeredCount ?? 0,
          correctCount: prior?.correctCount ?? 0,
          ...(prior?.accuracy !== undefined ? { accuracy: prior.accuracy } : {}),
          wordClickCount: (prior?.wordClickCount ?? 0) + 1,
          reviewWordIds,
          favorite: prior?.favorite ?? false,
          readingSeconds: prior?.readingSeconds ?? 0,
          needsReview: prior?.needsReview ?? false,
        };
        state = {
          ...state,
          readingArticleProgress: [nextProgress, ...(state.readingArticleProgress ?? []).filter((item) => item.slug !== article.slug)].slice(0, 500),
          dailyOperationKeys: [...(state.dailyOperationKeys ?? []), key].slice(-400),
        };
      } else if (action === "attempt") {
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
          reviewSnapshot: {
            level: question.level,
            levelBand: String(question.level),
            skillLabel: "Reading",
            context: question.passage_cn,
            prompt: question.question_en || question.question_cn,
            answerMode: "choice" as const,
            options: { ...question.options },
            correctAnswer: question.correct_answer,
            correctAnswerText: question.options[question.correct_answer],
            explanation: question.explanation ?? "Compare the supported detail with the other choices.",
          },
        }).state;
      } else if (action === "reading_article_attempt") {
        const articleSlug = short(payload.articleSlug, 120);
        const questionId = short(payload.questionId, 20);
        const answer = short(payload.answer, 8);
        const trusted = articleSlug && questionId ? articleQuestion(articleSlug, questionId) : undefined;
        const optionIndex = answer ? "ABCD".indexOf(answer) : -1;
        if (!trusted || optionIndex < 0 || optionIndex >= trusted.question.options.length) throw new Error("INVALID_READING_ARTICLE_ATTEMPT");
        const { article, question } = trusted;
        const selectedAnswer = answer as string;
        const answerKeys = ["A", "B", "C", "D"] as const;
        const correctAnswer = answerKeys[question.correctAnswer];
        if (!correctAnswer) throw new Error("INVALID_READING_ARTICLE_ANSWER_KEY");
        const options: Record<string, string> = Object.fromEntries(question.options.map((option, index) => [answerKeys[index], option]));
        const selectedOption = options[selectedAnswer];
        const correctOption = options[correctAnswer];
        if (!selectedOption || !correctOption) throw new Error("INVALID_READING_ARTICLE_OPTION");
        const recorded = recordAttempt(state, {
          idempotencyKey: key,
          contentId: `reading-article:${article.slug}:${question.id}`,
          contentVersion: article.contentVersion,
          dimension: "reading",
          answer: selectedAnswer,
          correctAnswer,
          prompt: question.prompt,
          userAnswerText: selectedOption,
          correctAnswerText: correctOption,
          observedAt: new Date().toISOString(),
          mode: "practice",
          skill: "reading",
          standardVersion: "HSK 3.0",
          reviewSnapshot: {
            level: article.level,
            levelBand: String(article.level),
            skillLabel: "Reading · article",
            topic: article.title,
            context: article.paragraphs.join("\n\n"),
            prompt: question.prompt,
            answerMode: "choice" as const,
            options,
            correctAnswer,
            correctAnswerText: correctOption,
            explanation: question.explanation,
          },
        });
        state = recorded.state;
        const articleAttempts = new Map<string, boolean>();
        for (const attempt of state.attempts.filter((item) => item.contentId.startsWith(`reading-article:${article.slug}:`))) {
          const attemptQuestionId = attempt.contentId.slice(`reading-article:${article.slug}:`.length);
          if (!articleAttempts.has(attemptQuestionId)) articleAttempts.set(attemptQuestionId, attempt.correct);
        }
        const answeredCount = articleAttempts.size;
        const correctCount = [...articleAttempts.values()].filter(Boolean).length;
        const now = new Date().toISOString();
        const prior = state.readingArticleProgress?.find((item) => item.slug === article.slug);
        const nextProgress = {
          slug: article.slug,
          level: article.level,
          openedAt: prior?.openedAt ?? now,
          lastViewedAt: now,
          scrollPercent: prior?.scrollPercent ?? 0,
          completed: prior?.completed ?? false,
          ...(prior?.completedAt ? { completedAt: prior.completedAt } : {}),
          answeredCount,
          correctCount,
          accuracy: answeredCount ? Math.round((correctCount / answeredCount) * 100) : undefined,
          wordClickCount: prior?.wordClickCount ?? 0,
          reviewWordIds: prior?.reviewWordIds ?? [],
          favorite: prior?.favorite ?? false,
          readingSeconds: prior?.readingSeconds ?? 0,
          needsReview: correctCount < answeredCount,
        };
        state = { ...state, readingArticleProgress: [nextProgress, ...(state.readingArticleProgress ?? []).filter((item) => item.slug !== article.slug)].slice(0, 500) };
        feedback = { correct: recorded.attempt.correct, correctAnswerText: correctOption, explanation: question.explanation };
      } else if (action === "topic_practice_attempt") {
        const topicSlug = short(payload.topicSlug, 100);
        const questionId = short(payload.questionId, 160);
        const answer = short(payload.answer, 8);
        const trusted = topicSlug ? await getTrustedTopicPracticeQuestions(topicSlug) : null;
        const question = trusted?.questions.find((candidate) => candidate.id === questionId);
        if (!question || !answer) throw new Error("INVALID_TOPIC_PRACTICE_REQUEST");
        if (question.mode === "listening") {
          const ticketId = short(payload.playbackTicket, 80);
          if (!ticketId) throw new Error("AUDIO_PLAYBACK_REQUIRED");
          await consumeStep7PlaybackTicket(identity.id, question.id, ticketId, key);
        }
        const answered = answerTopicPracticeQuestion(state, question, {
          answer,
          idempotencyKey: key,
          observedAt: new Date().toISOString(),
        });
        state = answered.state;
        feedback = answered.feedback;
      } else if (action === "dictionary_practice_attempt") {
        const assetId = short(payload.assetId, 120);
        const mode = short(payload.mode, 20);
        const answer = short(payload.answer, 8);
        const context = assetId ? await getDictionaryLearningContext(assetId) : null;
        if (!context || !mode || !answer) throw new Error("INVALID_DICTIONARY_PRACTICE");
        const exercise = resolveDictionaryPractice(context.current, context.candidates, mode, answer);
        if (exercise.mode === "listening") {
          const ticketId = short(payload.playbackTicket, 80);
          if (!ticketId) throw new Error("AUDIO_PLAYBACK_REQUIRED");
          await consumeStep7PlaybackTicket(identity.id, `dictionary:${context.current.assetId}:listening`, ticketId, key);
        }
        const options = Object.fromEntries(exercise.options.map((option) => [option.key, option.text]));
        const input = {
          idempotencyKey: key,
          contentId: context.current.contentId,
          contentVersion: context.current.contentVersion,
          dimension: exercise.mode === "listening" ? "audio" as const : "reading" as const,
          answer,
          correctAnswer: exercise.correctAnswer,
          prompt: exercise.prompt,
          userAnswerText: options[answer],
          correctAnswerText: exercise.correctAnswerText,
          observedAt: new Date().toISOString(),
          mode: exercise.mode === "listening" ? "listening" as const : "practice" as const,
          skill: "vocabulary",
          standardVersion: "HSK 3.0" as const,
          reviewSnapshot: {
            level: context.current.level,
            levelBand: context.current.levelBand === "7-9" ? "7–9" : context.current.levelBand,
            skillLabel: exercise.mode === "listening" ? "Vocabulary · listening" : exercise.mode === "pinyin" ? "Vocabulary · pinyin" : "Vocabulary · meaning",
            topic: context.current.hanzi,
            instruction: exercise.instruction,
            prompt: exercise.prompt,
            answerMode: "choice" as const,
            options,
            correctAnswer: exercise.correctAnswer,
            correctAnswerText: exercise.correctAnswerText,
            explanation: `${context.current.hanzi} (${context.current.pinyin}) means “${context.current.meaning}.”`,
            audioSrc: exercise.audioAsset?.src,
            audioText: exercise.mode === "listening" ? context.current.hanzi : undefined,
          },
        };
        if (exercise.mode === "listening") {
          const recorded = recordAudioAttempt(state, { ...input, dimension: "audio", playbackResult: "completed" });
          if (!("attempt" in recorded)) throw new Error("AUDIO_PLAYBACK_REQUIRED");
          state = recorded.state;
          feedback = { correct: recorded.attempt.correct, correctAnswerText: exercise.correctAnswerText };
        } else {
          const recorded = recordAttempt(state, input);
          state = recorded.state;
          feedback = { correct: recorded.attempt.correct, correctAnswerText: exercise.correctAnswerText };
        }
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
          reviewSnapshot: reviewSnapshotFromStep7Exercise(exercise),
        };
        state = listening
          ? recordAudioAttempt(state, { ...input, dimension: "audio", playbackResult: "completed" }).state
          : recordAttempt(state, input).state;
      } else if (action === "audio_attempt") {
        const assetId = short(payload.assetId, 80);
        const mode = payload.mode === "audio" || payload.mode === "context_audio" ? payload.mode as AudioMode : undefined;
        const answer = short(payload.answer, 8);
        const dailySessionId = short(payload.dailySessionId, 120);
        const dailyItemId = short(payload.dailyItemId, 220);
        const exercise = assetId && mode ? audioExercise(assetId, mode, Boolean(dailySessionId && dailyItemId)) : undefined;
        if (!exercise || !answer || !Object.hasOwn(exercise.options, answer)) throw new Error("INVALID_AUDIO_ATTEMPT");
        const activeToday = view(state, identity.id, tz, capabilities, identity.account?.timezone);
        state = activeToday.state;
        assertDailyAudioBinding(state, dailySessionId, dailyItemId, exercise, activeToday.session.id);
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
          reviewSnapshot: {
            level: exercise.word.level,
            levelBand: exercise.word.level >= 7 ? "7–9" : String(exercise.word.level),
            skillLabel: exercise.dimension === "audio" ? "Listening · word" : "Listening · sentence",
            topic: exercise.word.partOfSpeech,
            prompt: exercise.prompt,
            answerMode: "choice",
            options: { ...exercise.options },
            correctAnswer: exercise.correctAnswer,
            correctAnswerText: exercise.options[exercise.correctAnswer],
            explanation: `${exercise.word.hanzi} (${exercise.word.pinyin}) means “${exercise.word.meaning}.”`,
            audioSrc: exercise.word.audio.status === "formal" ? exercise.word.audio.src : undefined,
            audioText: exercise.voiceText,
          },
        });
        if (!("attempt" in recorded)) throw new Error("AUDIO_PLAYBACK_REQUIRED");
        state = recorded.state;
        feedback = { correct: recorded.attempt.correct, correctAnswerText: exercise.options[exercise.correctAnswer] };
      } else if (action === "audio_review_ready") {
        const cardId = short(payload.cardId, 120);
        const playbackTicket = short(payload.playbackTicket, 80);
        const cardRevision = Number(payload.cardRevision);
        if (!cardId || !Number.isInteger(cardRevision) || !playbackTicket) throw new Error("INVALID_AUDIO_REVIEW");
        await consumeStep7PlaybackTicket(identity.id, `review:${cardId}:${cardRevision}`, playbackTicket, key);
        state = markAudioReviewReady(state, cardId, cardRevision, key);
      } else if (action === "retry_review") {
        const cardId = short(payload.cardId, 120);
        const answer = short(payload.answer, 180);
        const cardRevision = Number(payload.cardRevision);
        const card = cardId ? state.cards.find((candidate) => candidate.id === cardId) : undefined;
        const attempt = card ? state.attempts.find((candidate) => candidate.id === card.sourceAttemptId) : undefined;
        const snapshot = attempt ? resolvedReviewSnapshotForAttempt(attempt) : undefined;
        const openMistake = card ? state.mistakes.some((mistake) => {
          const sourceAttempt = state.attempts.find((candidate) => candidate.id === mistake.sourceAttemptId);
          return mistake.contentId === card.contentId && mistake.contentVersion === card.contentVersion && sourceAttempt?.dimension === card.dimension && mistake.status === "open";
        }) : false;
        if (!card || !attempt || !snapshot || !openMistake || snapshot.answerMode === "self_recall" || !answer || !Number.isInteger(cardRevision)) throw new Error("INVALID_REVIEW_RETRY");
        const correct = checkReviewAnswer(snapshot, answer);
        const reviewCard = view(state, identity.id, tz, capabilities, identity.account?.timezone).cards.find((candidate) => candidate.id === card.id);
        state = gradeReview(state, { cardId: card.id, grade: correct ? "good" : "again", idempotencyKey: key, observedAt: new Date().toISOString(), clientRevision: cardRevision, requireAudioPlayback: reviewCard?.playbackRequired, resolveMistakes: true }).state;
        if (capabilities.dailyReviewGrades !== null) usageCharge = { metric: "daily_review_grades", periodKey, idempotencyKey: key, units: 1, limit: capabilities.dailyReviewGrades };
        feedback = { correct, correctAnswerText: snapshot.correctAnswerText };
        reviewCorrect = correct;
      } else if (action === "grade") {
        const cardId = short(payload.cardId, 120);
        const grade = short(payload.grade, 10);
        const clientRevision = Number(payload.clientRevision);
        if (!cardId || !grade || !["again", "hard", "good", "easy"].includes(grade) || !Number.isInteger(clientRevision)) throw new Error("INVALID_GRADE");
        const reviewCard = view(state, identity.id, tz, capabilities, identity.account?.timezone).cards.find((candidate) => candidate.id === cardId);
        const persistedCard = state.cards.find((candidate) => candidate.id === cardId);
        const hasOpenMistake = persistedCard ? state.mistakes.some((mistake) => {
          const sourceAttempt = state.attempts.find((candidate) => candidate.id === mistake.sourceAttemptId);
          return mistake.contentId === persistedCard.contentId && mistake.contentVersion === persistedCard.contentVersion && sourceAttempt?.dimension === persistedCard.dimension && mistake.status === "open";
        }) : false;
        state = gradeReview(state, { cardId, grade: grade as "again" | "hard" | "good" | "easy", idempotencyKey: key, observedAt: new Date().toISOString(), clientRevision, requireAudioPlayback: reviewCard?.playbackRequired, resolveMistakes: !hasOpenMistake }).state;
        reviewCorrect = grade !== "again";
        if (capabilities.dailyReviewGrades !== null) usageCharge = { metric: "daily_review_grades", periodKey, idempotencyKey: key, units: 1, limit: capabilities.dailyReviewGrades };
      } else if (action === "undo_review") {
        const cardId = short(payload.cardId, 120);
        if (!cardId) throw new Error("INVALID_REVIEW_UNDO");
        state = undoLastReview(state, { cardId, idempotencyKey: key });
      } else if (action === "dictionary_search") {
        const query = short(payload.query, 100);
        const level = Number.isInteger(payload.level) ? Number(payload.level) : undefined;
        if (!query) throw new Error("INVALID_DICTIONARY_SEARCH");
        state = recordDictionarySearch(state, { query, level, searchedAt: new Date().toISOString() });
        state = { ...state, dailyOperationKeys: [...(state.dailyOperationKeys ?? []), key].slice(-400) };
      } else if (action === "clear_dictionary_searches") {
        state = { ...state, recentDictionarySearches: [], dailyOperationKeys: [...(state.dailyOperationKeys ?? []), key].slice(-400) };
      } else if (action === "touch_topic") {
        const topicSlug = short(payload.topicSlug, 100);
        const lastAssetId = short(payload.lastAssetId, 120);
        const topic = topicSlug ? await getVerifiedTopicForMutation(topicSlug) : null;
        if (!topic || !lastAssetId || !topic.wordAssetIds.includes(lastAssetId)) throw new Error("INVALID_TOPIC_PROGRESS");
        state = recordTopicVisit(state, { topicSlug: topic.slug, lastAssetId, visitedAt: new Date().toISOString() });
        state = { ...state, dailyOperationKeys: [...(state.dailyOperationKeys ?? []), key].slice(-400) };
      } else if (action === "topic_batch_today" || action === "topic_batch_review") {
        const topicSlug = short(payload.topicSlug, 100);
        const lessonId = short(payload.lessonId, 100);
        const sessionId = short(payload.sessionId, 120);
        const topic = topicSlug ? await getVerifiedTopicForMutation(topicSlug) : null;
        const lesson = lessonId ? topic?.lessons?.find((candidate) => candidate.id === lessonId) : undefined;
        if (!topic || (lessonId && !lesson) || (action === "topic_batch_today" && !sessionId)) throw new Error("INVALID_TOPIC_BATCH");
        const assetIds = lesson?.wordAssetIds ?? topic.wordAssetIds;
        const contexts = await Promise.all(assetIds.map((assetId) => getDictionaryLearningContext(assetId)));
        if (contexts.some((context) => !context || !context.current.contentVersion.startsWith(`${topic.sourceReleaseId}:`))) throw new Error("INVALID_TOPIC_BATCH");
        if (action === "topic_batch_today") {
          for (const context of contexts) {
            if (!context) continue;
            state = addWordToToday(state, {
              sessionId: sessionId!,
              assetId: context.current.assetId,
              contentId: context.current.contentId,
              contentVersion: context.current.contentVersion,
              title: `${context.current.hanzi} ${context.current.pinyin}`,
              href: `/word/${context.current.assetId}`,
            });
          }
        } else {
          const observedAt = new Date().toISOString();
          for (const context of contexts) if (context) state = addWordToReview(state, { word: context.current, observedAt });
        }
        state = recordTopicVisit(state, { topicSlug: topic.slug, lastAssetId: topic.wordAssetIds[0], visitedAt: new Date().toISOString() });
        state = { ...state, dailyOperationKeys: [...(state.dailyOperationKeys ?? []), key].slice(-400) };
      } else if (action === "add_to_review") {
        const assetId = short(payload.assetId, 120);
        const context = assetId ? await getDictionaryLearningContext(assetId) : null;
        if (!context) throw new Error("INVALID_DICTIONARY_WORD");
        state = addWordToReview(state, { word: context.current, observedAt: new Date().toISOString() });
        state = { ...state, dailyOperationKeys: [...(state.dailyOperationKeys ?? []), key].slice(-400) };
      } else if (action === "save_word") {
        const assetId = short(payload.assetId, 120);
        const item = assetId ? await resolveTodayDictionaryItem(assetId) : undefined;
        if (!item || typeof payload.save !== "boolean") throw new Error("INVALID_DICTIONARY_WORD");
        state = toggleSavedWord(state, { assetId: item.assetId, save: payload.save });
        state = { ...state, dailyOperationKeys: [...(state.dailyOperationKeys ?? []), key].slice(-400) };
      } else if (action === "add_to_today") {
        const assetId = short(payload.assetId, 120);
        const sessionId = short(payload.sessionId, 120);
        const item = assetId ? await resolveTodayDictionaryItem(assetId) : undefined;
        if (!item || !sessionId) throw new Error("INVALID_DICTIONARY_WORD");
        state = addWordToToday(state, {
          sessionId,
          assetId: item.assetId,
          contentId: item.contentId,
          contentVersion: item.contentVersion,
          title: `${item.hanzi} ${item.pinyin}`,
          href: `/word/${item.studySlug}`,
        });
        state = { ...state, dailyOperationKeys: [...(state.dailyOperationKeys ?? []), key].slice(-400) };
      } else if (action === "complete_item" || action === "skip_item" || action === "restore_item") {
        const sessionId = short(payload.sessionId, 120);
        const itemId = short(payload.itemId, 160);
        if (!sessionId || !itemId) throw new Error("INVALID_ITEM");
        const activeToday = view(state, identity.id, tz, capabilities, identity.account?.timezone);
        assertCurrentDailySession(activeToday.session, sessionId);
        state = activeToday.state;
        const currentItem = state.dailySessions.find((session) => session.id === sessionId)?.items.find((item) => item.id === itemId);
        if (action === "complete_item" && currentItem?.kind === "learn") {
          const assetId = short(payload.assetId, 120);
          const displayedWord = assetId ? await resolveTodayDictionaryItem(assetId) : undefined;
          if (!displayedWord) throw new Error("TODAY_LEARN_WORD_MISMATCH");
          assertTodayLearnItemMatches(state, { sessionId, itemId, contentId: displayedWord.contentId, contentVersion: displayedWord.contentVersion });
        }
        state = applyDailyItemAction(state, {
          sessionId,
          itemId,
          action: action === "complete_item" ? "complete" : action === "skip_item" ? "skip" : "restore",
          idempotencyKey: key,
          observedAt: new Date().toISOString(),
        }).state;
        if (action === "complete_item" && currentItem?.kind === "learn" && currentItem.status === "pending" && capabilities.dailyNewItems !== null) {
          usageCharge = { metric: "daily_new_items", periodKey, idempotencyKey: key, units: 1, limit: capabilities.dailyNewItems };
        }
      } else if (action === "configure_today") {
        const budgetMinutes = Number(payload.budgetMinutes);
        if (!isTodayBudgetMinutes(budgetMinutes)) throw new Error("INVALID_TIME_BUDGET");
        const newWordCount = Number(payload.newWordCount);
        if (!isTodayNewWordCount(newWordCount)) throw new Error("INVALID_NEW_WORD_COUNT");
        const listeningEnabled = payload.listeningEnabled;
        if (typeof listeningEnabled !== "boolean") throw new Error("INVALID_LISTENING_PREFERENCE");
        const focus = payload.focus;
        if (!isTodayFocus(focus)) throw new Error("INVALID_TODAY_FOCUS");
        const requestedLevel = payload.startLevel === undefined ? state.preferredLearningLevel : Number(payload.startLevel);
        if (requestedLevel !== undefined && (!Number.isInteger(requestedLevel) || requestedLevel < 1 || requestedLevel > 9)) throw new Error("INVALID_LEARNING_LEVEL");
        const observedAt = new Date().toISOString();
        const latestPlacement = [...(state.placementResults ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
        const startLevel = requestedLevel ?? latestPlacement?.recommendedLevel ?? 1;
        const todayPreferences = { newWordCount, listeningEnabled, focus };
        state = { ...state, ...(requestedLevel ? { preferredLearningLevel: requestedLevel } : {}), todayPreferences };
        state = buildDailySession(state, { ownerId: identity.id, localDay: learningLocalDay(observedAt, tz, identity.account?.timezone), ruleVersion: "today-v9", now: observedAt, dailyContent: selectTodayContent(startLevel, newWordCount), budgetMinutes, ...todayPreferences }).state;
        state = { ...state, dailyOperationKeys: [...(state.dailyOperationKeys ?? []), key].slice(-400) };
      } else {
        return errorResponse("INVALID_ACTION", 422);
      }
      const qualifyingLearningAction = action === "attempt" || action === "topic_practice_attempt" || action === "dictionary_practice_attempt" || action === "step7_attempt" || action === "audio_attempt" || action === "retry_review" || action === "grade" || action === "complete_item";
      const referralActivity: ReferralLearningActivity | undefined = identity.account && qualifyingLearningAction
        ? { userId: identity.account.userId, eventType: String(action), eventId: key, units: 1, localDay: new Date().toISOString().slice(0, 10) }
        : undefined;
      const engagementActivity = identity.account && qualifyingLearningAction
        ? { localDay: await learningRewardLocalDay(identity.id, identity.account.timezone || "UTC"), action: String(action), idempotencyKey: key }
        : undefined;
      const data = view(state, identity.id, tz, capabilities, identity.account?.timezone);
      await saveState(identity.id, data.state, loaded.revision, createAuditEvent({ subjectId: identity.id, action: String(action), resourceType: "learning", resourceId: data.session.id, result: "success", idempotencyKey: key, metadata: { revision: loaded.revision + 1, ...(typeof reviewCorrect === "boolean" ? { reviewCorrect } : {}) } }), usageCharge, referralActivity, engagementActivity);
      if (referralActivity) {
        try { await reconcileReferralLearningMilestone(referralActivity.userId); } catch { /* activity is committed atomically and the reward reconciles on Account load */ }
      }
      if (usageCharge?.metric === "daily_new_items") usage = { ...usage, dailyNewItems: usage.dailyNewItems + usageCharge.units };
      if (usageCharge?.metric === "daily_review_grades") usage = { ...usage, dailyReviewGrades: usage.dailyReviewGrades + usageCharge.units };
      return response(data, identity.fresh, identity.id, loaded.revision + 1, Boolean(identity.account), capabilities, usage, feedback);
    } catch (error) {
      const unavailable = d1UnavailableResponse(error);
      if (unavailable) return unavailable;
      const code = error instanceof Error ? error.message : "SAVE_FAILED";
      const replayable = action === "attempt" || action === "topic_practice_attempt" || action === "dictionary_practice_attempt" || action === "step7_attempt" || action === "audio_attempt" || action === "audio_review_ready" || action === "retry_review" || action === "grade" || action === "undo_review" || dailyAction;
      if (code === "REVISION_CONFLICT" && replayable && turn < 2) continue;
      if (code === "REVISION_CONFLICT") await recordPolicyAudit(createAuditEvent({ subjectId: identity.id, action: String(action), resourceType: "learning", resourceId: identity.id, result: "conflict", idempotencyKey: key }));
      return errorResponse(code, code === "ACCOUNT_DELETED" ? 403 : code === "REVISION_CONFLICT" ? 409 : code.startsWith("FREE_DAILY_") ? 429 : 422, code.startsWith("FREE_DAILY_") ? { upgradeHref: "/pricing" } : {});
    }
  }
  return errorResponse("REVISION_CONFLICT", 409);
}

export async function POST(req: NextRequest) {
  try { return await postLearning(req); }
  catch (error) { const unavailable = d1UnavailableResponse(error); if (unavailable) return unavailable; throw error; }
}
