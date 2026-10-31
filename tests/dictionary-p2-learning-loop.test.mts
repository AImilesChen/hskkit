import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  addWordToToday,
  addWordToReview,
  addFlashcardWordsToReview,
  buildDailySession,
  recordDictionarySearch,
  type LearningState,
} from "../src/lib/learning/domain.ts";
import { mergeLearningStates, previewMerge } from "../src/lib/account/domain.ts";
import {
  buildDictionaryPractice,
  dictionaryWordProgress,
  type DictionaryPracticeWord,
} from "../src/lib/dictionary/p2-learning.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative: string) => fs.readFileSync(path.join(root, relative), "utf8");
const empty = (): LearningState => ({ attempts: [], cards: [], mistakes: [], dailySessions: [] });
const audioAsset = {
  id: "test-word-audio", src: "/audio/word-ai.mp3", kind: "word" as const,
  sourceType: "synthesized" as const, sourceLabel: "Synthesized pronunciation" as const,
  provider: "test", authorization: { status: "authorized" as const, license: "test", evidenceUrl: "https://hskkit.com/content-license" },
  qa: { lifecycle: "published" as const, content: "approved" as const, technical: "approved" as const },
};
const word = (overrides: Partial<DictionaryPracticeWord> = {}): DictionaryPracticeWord => ({
  assetId: "hsk3.word.l1.0001.v1",
  contentId: "word:hsk3.word.l1.0001.v1",
  contentVersion: "hsk3-content-truth-v5:1",
  level: 1,
  levelBand: "1",
  hanzi: "爱",
  traditional: "愛",
  pinyin: "ài",
  meaning: "to love",
  audioAsset,
  ...overrides,
});

const distractors = [
  word({ assetId: "hsk3.word.l1.0002.v1", contentId: "word:hsk3.word.l1.0002.v1", hanzi: "八", traditional: "八", pinyin: "bā", meaning: "eight", audioAsset: undefined }),
  word({ assetId: "hsk3.word.l1.0003.v1", contentId: "word:hsk3.word.l1.0003.v1", hanzi: "爸爸", traditional: "爸爸", pinyin: "bà ba", meaning: "father", audioAsset: undefined }),
  word({ assetId: "hsk3.word.l1.0004.v1", contentId: "word:hsk3.word.l1.0004.v1", hanzi: "杯子", traditional: "杯子", pinyin: "bēi zi", meaning: "cup", audioAsset: undefined }),
];

test("dictionary searches are durable, de-duplicated and bounded", () => {
  let state = empty();
  for (let index = 0; index < 14; index += 1) {
    state = recordDictionarySearch(state, { query: `word ${index}`, level: index % 2 ? 1 : undefined, searchedAt: `2026-08-30T00:${String(index).padStart(2, "0")}:00.000Z` });
  }
  state = recordDictionarySearch(state, { query: " word 13 ", level: 1, searchedAt: "2026-08-30T01:00:00.000Z" });
  assert.equal(state.recentDictionarySearches?.length, 10);
  assert.equal(state.recentDictionarySearches?.[0].query, "word 13");
  assert.equal(state.recentDictionarySearches?.filter((item) => item.query === "word 13").length, 1);
});

test("Add to Review creates one due card with an immutable word snapshot", () => {
  const input = word();
  const first = addWordToReview(empty(), { word: input, observedAt: "2026-08-30T02:00:00.000Z" });
  const replay = addWordToReview(first, { word: input, observedAt: "2026-08-30T02:05:00.000Z" });
  assert.equal(first.cards.length, 1);
  assert.equal(first.cards[0].dueAt, "2026-08-30T02:00:00.000Z");
  assert.equal(first.cards[0].dimension, "reading");
  assert.equal(first.attempts[0].reviewSnapshot?.correctAnswerText, "爱 · ài · to love");
  assert.deepEqual(replay, first);
});

test("flashcard batch saves only new review cards and leaves existing due dates unchanged", () => {
  const first = word();
  const second = distractors[0];
  const scheduled = addWordToReview(empty(), { word: first, observedAt: "2026-10-30T12:00:00.000Z", dueAt: "2026-11-03T12:00:00.000Z" });
  const result = addFlashcardWordsToReview(scheduled, [first, second, second], "2026-10-31T12:00:00.000Z");
  assert.equal(result.added, 1);
  assert.equal(result.already, 2);
  assert.equal(result.state.cards.length, 2);
  assert.equal(result.state.cards.find((card) => card.contentId === first.contentId)?.dueAt, "2026-11-03T12:00:00.000Z");
  assert.equal(result.state.cards.find((card) => card.contentId === second.contentId)?.dueAt, "2026-10-31T12:00:00.000Z");
});

test("adding a Review card does not remove an explicitly added Today word", () => {
  const ownerId = "guest-p2-continuity";
  const localDay = "2026-08-30";
  const now = "2026-08-30T02:00:00.000Z";
  const initial = buildDailySession(empty(), { ownerId, localDay, ruleVersion: "today-v4", now });
  const withToday = addWordToToday(initial.state, {
    sessionId: initial.session.id,
    assetId: word().assetId,
    contentId: word().contentId,
    contentVersion: word().contentVersion,
    title: `${word().hanzi} ${word().pinyin}`,
    href: `/word/${word().assetId}`,
  });
  const withReview = addWordToReview(withToday, { word: word(), observedAt: now });
  const rebuilt = buildDailySession(withReview, { ownerId, localDay, ruleVersion: "today-v4", now });
  assert.equal(rebuilt.session.items.filter((item) => item.id === `dictionary:${word().assetId}`).length, 1);
  assert.equal(dictionaryWordProgress(rebuilt.state, word().assetId, now).today, "pending");
  assert.equal(dictionaryWordProgress(rebuilt.state, word().assetId, now).review, "due");
});

test("word practice provides meaning, pinyin and published synthesized listening without invented audio", () => {
  const practice = buildDictionaryPractice(word(), distractors);
  assert.deepEqual(practice.map((item) => item.mode), ["meaning", "pinyin", "listening"]);
  assert.ok(practice.every((item) => item.options.length === 4));
  assert.equal(practice.find((item) => item.mode === "listening")?.audioAsset?.src, "/audio/word-ai.mp3");
  assert.deepEqual(buildDictionaryPractice(word({ audioAsset: undefined }), distractors).map((item) => item.mode), ["meaning", "pinyin"]);
});

test("learned and due states derive from real attempts, cards, Today and saved state", () => {
  const queued = addWordToReview({ ...empty(), savedWordIds: [word().assetId] }, { word: word(), observedAt: "2026-08-30T02:00:00.000Z" });
  const progress = dictionaryWordProgress(queued, word().assetId, "2026-08-30T03:00:00.000Z");
  assert.equal(progress.saved, true);
  assert.equal(progress.learned, true);
  assert.equal(progress.review, "due");
});

test("guest-to-account merge preserves saved words and recent searches once", () => {
  const account: LearningState = { ...empty(), savedWordIds: ["account-word"], recentDictionarySearches: [{ query: "你好", searchedAt: "2026-08-30T01:00:00.000Z" }] };
  const guest: LearningState = { ...empty(), savedWordIds: ["guest-word"], recentDictionarySearches: [{ query: "学习", level: 2, searchedAt: "2026-08-30T02:00:00.000Z" }] };
  const merged = mergeLearningStates(account, guest);
  const replay = mergeLearningStates(merged.state, guest);
  assert.deepEqual(new Set(merged.state.savedWordIds), new Set(["account-word", "guest-word"]));
  assert.deepEqual(replay.state.savedWordIds, merged.state.savedWordIds);
  assert.deepEqual(merged.state.recentDictionarySearches?.map((item) => item.query), ["学习", "你好"]);
  const preview = previewMerge(account, guest);
  assert.equal(preview.savedWordAdditions, 1);
  assert.equal(preview.recentSearchAdditions, 1);
});

test("P2 UI exposes the complete learner loop and keeps stroke order gated", () => {
  const search = read("src/app/components/dictionary-search.tsx");
  const actions = read("src/app/components/dictionary-word-actions.tsx");
  const wordPage = read("src/app/word/[slug]/page.tsx");
  const scriptToggle = read("src/app/components/word-script-toggle.tsx");
  const practice = read("src/app/word/[slug]/practice/word-practice-client.tsx");
  const saved = read("src/app/saved/saved-words-client.tsx");
  assert.match(search, /Recent searches/);
  assert.match(search, /Simplified|Traditional/);
  assert.match(actions, /Add to Review/);
  assert.match(actions, /Learned|Due for review|Review scheduled/);
  assert.match(actions, /\/saved/);
  assert.match(wordPage, /Same sound, compare the tones/);
  assert.match(wordPage, /Next in HSK/);
  assert.match(scriptToggle, /<h1 className="[^"]*text-white/);
  assert.match(practice, /Listen and choose|Choose the meaning|Choose the pinyin/);
  assert.match(saved, /Saved words/);
  assert.doesNotMatch(wordPage, /Stroke order|strokeOrder/);
});

test("P2 server contracts validate dictionary practice and exact catalog context", () => {
  const route = read("src/app/api/v1/learning/route.ts");
  const catalog = read("src/lib/content/catalog-search.ts");
  assert.match(route, /dictionary_practice_attempt/);
  assert.match(route, /dictionary_search/);
  assert.match(route, /add_to_review/);
  assert.match(route, /resolveDictionaryPractice/);
  assert.match(catalog, /findCatalogWordLearningContext/);
  assert.match(catalog, /level_band = current\.level_band/);
  assert.match(catalog, /search_pinyin = current\.search_pinyin/);
});
