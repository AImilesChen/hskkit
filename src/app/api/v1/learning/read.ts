import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { d1UnavailableResponse, userD1RetryAfterSeconds, withUserD1ReadProtection } from "@/lib/d1/user-protection";
import { createHash } from "node:crypto";

import { buildDailySession, isOpenMistakeForCard, masterySnapshot, type DailyItem, type DailyLearnContent, type LearningState } from "../../../../lib/learning/domain";
import { isTodayBudgetMinutes, recommendTodayNewWordCount } from "../../../../lib/learning/today-plan";
import { trustedAudioExercise, trustedTodayAudioExercise, type AudioMode } from "../../../../lib/learning/audio";
import { requestIdentity, GUEST_COOKIE } from "../../../../lib/account/identity";
import { loadState, usageSnapshot } from "../../../../lib/learning/storage";
import { projectLearningHistory } from "../../../../lib/learning/projection";
import { resolveCapabilities } from "../../../../lib/commercial/storage";
import { type ProductCapabilities } from "../../../../lib/commercial/capabilities";
import { selectTodayContent, todayContentByAssetId, todayContentByContentId, todayContentFromCatalogRow, todayPlanLevel, todaySelectionContext, type TodayContentItem } from "../../../../lib/learning/today-content";
import { findPublicCatalogWordById } from "../../../../lib/content/public-catalog-index";
import { accessDecision, createAuditEvent, errorContract } from "../../../../lib/account/access-policy";
import { recordPolicyAudit } from "../../../../lib/account/audit-storage";
import { computeSessionStreak } from "../../../../lib/account/domain";
import { computeOffsetSessionStreak, deriveHomeNextStep, learningLocalDay } from "../../../../lib/learning/progress";
import { legacyListeningReviewPresentation } from "../../../../lib/learning/review-content";
import { reviewLevelControl } from "../../../../lib/learning/review-session";
import { resolvedReviewSnapshotForAttempt } from "../../../../lib/learning/review-content-resolver";
import { getDictionaryWordsByIds } from "../../../../lib/dictionary/p2-server";
import { dictionaryWordProgress } from "../../../../lib/dictionary/p2-learning";
import { learningTopics } from "../../../../lib/topics/catalog";
import { topicWordProgressFromState } from "../../../../lib/topics/progress";

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
function dailyLearnContent(word: TodayContentItem): DailyLearnContent {
  return {
    assetId: word.assetId,
    contentId: word.contentId,
    contentVersion: word.contentVersion,
    level: word.level,
    levelBand: word.level >= 7 ? "7–9" : String(word.level),
    hanzi: word.hanzi,
    traditional: word.hanzi,
    pinyin: word.pinyin,
    meaning: word.meaning,
    partOfSpeech: word.partOfSpeech,
    example: word.example,
    audioSrc: word.audioSrc,
  };
}
function refreshTodayDisplayItem(item: DailyItem): DailyItem {
  if (item.kind !== "learn" && item.kind !== "listen") return item;
  const dictionaryAssetId = item.id.startsWith("dictionary:") ? item.id.slice("dictionary:".length) : undefined;
  const current = dictionaryAssetId ? todayContentByAssetId(dictionaryAssetId) : todayContentByContentId(item.contentId);
  if (!current) return item;
  if (item.kind === "learn") return { ...item, title: `Learn ${current.hanzi}`, learnContent: dailyLearnContent(current) };
  if (item.dimension === "audio") return { ...item, title: `Listen to ${current.hanzi}` };
  return item;
}
const offset = (value: unknown) => Number.isInteger(value) && Number(value) >= -840 && Number(value) <= 840 ? Number(value) : 0;
const PRIVATE_RESPONSE_HEADERS = { "Cache-Control": "private, no-store" } as const;
const errorResponse = (code: string, status: number, extra: Record<string, unknown> = {}) => NextResponse.json({ ...errorContract(code), ...extra }, { status, headers: PRIVATE_RESPONSE_HEADERS });
const reportPlaybackVerificationFailure = (action: string, code: string) => console.warn("[playback-verification]", { action, code });
async function requireLearningAccess(identity: Awaited<ReturnType<typeof owner>>, permission: "learning:read" | "learning:write") {
  const decision = accessDecision({ accountStatus: identity.account?.status ?? "guest", permission });
  if (!decision.allowed) {
    await recordPolicyAudit(createAuditEvent({ subjectId: identity.id, action: permission, resourceType: "learning", resourceId: identity.id, result: "denied", idempotencyKey: `${permission}:${crypto.randomUUID()}` }));
  }
  return decision;
}
type RouteTimingSeed = { routeStartedAt: number; moduleLoadedAt: number };
type StageSample = { name: string; durationMs: number };

function createStageTimer(seed: RouteTimingSeed) {
  const stages: StageSample[] = [{ name: "module_load", durationMs: seed.moduleLoadedAt - seed.routeStartedAt }];
  async function measure<T>(name: string, operation: () => Promise<T>) {
    const startedAt = performance.now();
    try { return await operation(); }
    finally { stages.push({ name, durationMs: performance.now() - startedAt }); }
  }
  function measureSync<T>(name: string, operation: () => T) {
    const startedAt = performance.now();
    try { return operation(); }
    finally { stages.push({ name, durationMs: performance.now() - startedAt }); }
  }
  const round = (value: number) => Math.max(0, Math.round(value * 10) / 10);
  return {
    measure,
    measureSync,
    header: () => stages.map(({ name, durationMs }) => `${name};dur=${round(durationMs)}`).join(", "),
    report(status: number) {
      console.info("[learning-get-timing]", JSON.stringify({ status, totalMs: round(performance.now() - seed.routeStartedAt), stages: stages.map(({ name, durationMs }) => ({ name, durationMs: round(durationMs) })) }));
    },
  };
}

type LearningStageTimer = ReturnType<typeof createStageTimer>;
function protectedStage<T>(timer: LearningStageTimer, name: string, operation: () => Promise<T>) {
  return timer.measure(name, () => withUserD1ReadProtection(operation));
}

function view(state: LearningState, ownerId: string, offsetMinutes: number, capabilities: ProductCapabilities, accountTimezone?: string) {
  const now = new Date().toISOString();
  const nextAction = deriveHomeNextStep(state, now);
  const latestPlacement = [...(state.placementResults ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const preferredStartLevel = state.preferredLearningLevel ?? latestPlacement?.recommendedLevel ?? 1;
  const localDay = learningLocalDay(now, offsetMinutes, accountTimezone);
  const prior = state.dailySessions.find((session) => session.ownerId === ownerId && session.localDay === localDay);
  const startLevel = todayPlanLevel(state, ownerId, localDay, preferredStartLevel);
  const budgetMinutes = isTodayBudgetMinutes(prior?.budgetMinutes) ? prior.budgetMinutes : 20;
  const legacySingleWordPlan = prior?.ruleVersion === "today-v8" && prior.newWordCount === 1 && budgetMinutes >= 10;
  const savedPreferences = state.todayPreferences;
  const preferences = {
    newWordCount: legacySingleWordPlan ? recommendTodayNewWordCount(budgetMinutes) : savedPreferences?.newWordCount ?? recommendTodayNewWordCount(budgetMinutes),
    listeningEnabled: savedPreferences?.listeningEnabled ?? true,
    focus: savedPreferences?.focus ?? "balanced" as const,
  };
  const selectionContext = todaySelectionContext(state, ownerId, localDay);
  const built = buildDailySession(state, { ownerId, localDay, ruleVersion: "today-v10", now, dailyContent: selectTodayContent(startLevel, preferences.newWordCount, selectionContext), budgetMinutes, ...preferences });
  const projected = projectLearningHistory(built.state, capabilities, new Date(now));
  const visibleCards = projected.cards;
  const cards = visibleCards.map((card) => {
    const attempt = built.state.attempts.find((candidate) => candidate.id === card.sourceAttemptId);
    const snapshot = attempt ? resolvedReviewSnapshotForAttempt(attempt) : undefined;
    const assetId = attempt?.contentId.startsWith("word:") ? attempt.contentId.slice(5) : undefined;
    const todayAssetId = assetId ?? todayContentByContentId(attempt?.contentId ?? "")?.assetId;
    const audio = card.dimension !== "reading" && assetId
      ? (trustedAudioExercise(assetId, card.dimension as AudioMode) ?? trustedTodayAudioExercise(assetId, card.dimension as AudioMode))
      : undefined;
    const vocabulary = audio?.word;
    const formalAudioSrc = snapshot?.audioSrc ?? (audio?.word.audio.status === "formal" ? audio.word.audio.src : undefined);
    const formalAudioText = snapshot?.audioText ?? audio?.voiceText;
    const completeListeningQuestion = card.dimension !== "reading" && Boolean(snapshot && snapshot.audioSrc && snapshot.audioText);
    const fallbackAudio = card.dimension !== "reading" && !completeListeningQuestion && todayAssetId
      ? (trustedTodayAudioExercise(todayAssetId, "audio") ?? trustedAudioExercise(todayAssetId, "audio"))
      : undefined;
    const fallbackAudioSrc = fallbackAudio?.word.audio.status === "formal" ? fallbackAudio.word.audio.src : undefined;
    const fallbackAudioText = fallbackAudio?.voiceText;
    const legacyListening = card.dimension === "reading" || completeListeningQuestion
      ? undefined
      : legacyListeningReviewPresentation(fallbackAudio?.word, fallbackAudioSrc, fallbackAudioText);
    const vocabularyPresentation = legacyListening?.reviewable ? legacyListening : undefined;
    const todayReviewMode = card.dimension === "reading"
      ? "reading_unchanged" as const
      : completeListeningQuestion
        ? "question_review" as const
        : legacyListening?.reviewMode ?? "unsupported_legacy" as const;
    const todayReviewable = card.dimension === "reading" || todayReviewMode !== "unsupported_legacy";
    const todayVocabulary = fallbackAudio?.word;
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
      todayReviewMode,
      todayReviewable,
      todayPrompt: completeListeningQuestion ? snapshot?.prompt : vocabularyPresentation?.prompt,
      todayInstruction: completeListeningQuestion ? snapshot?.instruction : vocabularyPresentation?.instruction,
      todayAudioSrc: completeListeningQuestion ? snapshot?.audioSrc : fallbackAudioSrc,
      todayAudioText: completeListeningQuestion ? snapshot?.audioText : fallbackAudioText,
      todayPlaybackRequired: card.dimension !== "reading" && Boolean((completeListeningQuestion ? snapshot?.audioSrc : fallbackAudioSrc) && (completeListeningQuestion ? snapshot?.audioText : fallbackAudioText)),
      todayPlaybackReady: card.dimension === "reading" || !(completeListeningQuestion ? snapshot?.audioSrc : fallbackAudioSrc) || !(completeListeningQuestion ? snapshot?.audioText : fallbackAudioText) || Boolean(built.state.audioReviewReady?.some((ready) => ready.cardId === card.id && ready.cardRevision === card.revision)),
      todayHanzi: todayVocabulary?.hanzi,
      todayPinyin: todayVocabulary?.pinyin,
      todayMeaning: todayVocabulary?.meaning,
      todayExample: todayVocabulary?.example,
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
      playbackRequired: card.dimension !== "reading" && Boolean(formalAudioSrc && formalAudioText),
      playbackReady: card.dimension === "reading" || !formalAudioSrc || !formalAudioText || Boolean(built.state.audioReviewReady?.some((ready) => ready.cardId === card.id && ready.cardRevision === card.revision)),
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
    items: built.session.items.map(refreshTodayDisplayItem),
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
async function getLearning(req: NextRequest, timer: LearningStageTimer) {
  const identity = await timer.measure("identity", () => withUserD1ReadProtection(owner));
  const access = await timer.measure("access", () => requireLearningAccess(identity, "learning:read"));
  if (!access.allowed) return errorResponse(access.code, 403);
  const tz = offset(req.nextUrl.searchParams.get("tzOffset") ? Number(req.nextUrl.searchParams.get("tzOffset")) : 0);
  const periodKey = learningLocalDay(new Date().toISOString(), tz, identity.account?.timezone);
  const [loaded, capabilities, usage] = await Promise.all([
    protectedStage(timer, "learning_state", () => loadState(identity.id)),
    protectedStage(timer, "capabilities", () => resolveCapabilities(identity.id)),
    protectedStage(timer, "usage", () => usageSnapshot(identity.id, periodKey)),
  ]);
  const data = timer.measureSync("projection", () => view(loaded.state, identity.id, tz, capabilities, identity.account?.timezone));
  const words = await timer.measure("saved_words", () => getDictionaryWordsByIds(data.state.savedWordIds ?? []));
  return response(data, identity.fresh, identity.id, loaded.revision, Boolean(identity.account), capabilities, usage, undefined, words);
}

export async function getLearningResponse(req: NextRequest, seed: RouteTimingSeed) {
  const timer = createStageTimer(seed);
  try {
    const result = await getLearning(req, timer);
    result.headers.set("Server-Timing", timer.header());
    timer.report(result.status);
    return result;
  } catch (error) {
    const unavailable = d1UnavailableResponse(error, userD1RetryAfterSeconds());
    if (unavailable) {
      unavailable.headers.set("Server-Timing", timer.header());
      timer.report(unavailable.status);
      return unavailable;
    }
    timer.report(500);
    throw error;
  }
}
