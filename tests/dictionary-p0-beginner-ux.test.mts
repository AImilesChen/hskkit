import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { detectDictionaryQueryType } from "../src/lib/dictionary/search-intent.ts";
import { addWordToToday, toggleSavedWord, type LearningState } from "../src/lib/learning/domain.ts";
import { getPublishedWordBySlug } from "../src/lib/dictionary/runtime-word.ts";
import { isCatalogWordAssetId } from "../src/lib/content/catalog-search.ts";
import { findPublicCatalogWordById } from "../src/lib/content/public-catalog-index.ts";
import { selectTodayContent, todayContentByAssetId, todayContentFromCatalogRow } from "../src/lib/learning/today-content.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative: string) => fs.readFileSync(path.join(root, relative), "utf8");

function emptyState(): LearningState {
  return { attempts: [], cards: [], mistakes: [], dailySessions: [{ id: "today-1", ownerId: "guest", localDay: "2026-08-30", ruleVersion: "today-v4", createdAt: "2026-08-30T00:00:00.000Z", items: [{ id: "summary", kind: "summary", contentId: "summary", status: "completed" }] }] };
}

test("dictionary query intent recognizes Hanzi, pinyin and English without a field selector", () => {
  assert.equal(detectDictionaryQueryType("学习"), "hanzi");
  assert.equal(detectDictionaryQueryType("xué xí"), "pinyin");
  assert.equal(detectDictionaryQueryType("xue xi"), "pinyin");
  assert.equal(detectDictionaryQueryType("to study"), "english");
  assert.equal(detectDictionaryQueryType("learn"), "english");
});

test("dictionary landing is browseable on first load and exposes HSK 1–6 plus the unified 7–9 band directly", () => {
  const page = read("src/app/dictionary/page.tsx");
  const client = read("src/app/components/dictionary-search.tsx");
  assert.match(page, /Find a Chinese word you can use/);
  assert.match(client, /\{ value: "7", label: "HSK 7–9" \}/);
  assert.doesNotMatch(client, /label: "HSK [89]"/);
  assert.match(client, /Beginner words to explore/);
  assert.match(client, /pageSize:\s*"12"/);
  assert.doesNotMatch(client, />Search field</);
});

test("the explicit All level is distinct from the beginner-first empty landing", () => {
  const client = read("src/app/components/dictionary-search.tsx");
  assert.match(client, /searchParams\.has\("level"\)/);
  assert.match(client, /if \(nextLevel !== "default"\) params\.set\("level", nextLevel\)/);
  assert.match(client, /navigate\(\{ level: "all", page: 1 \}\)/);
});

test("instant suggestions are debounced, keyboard accessible and use automatic intent", () => {
  const client = read("src/app/components/dictionary-search.tsx");
  assert.match(client, /setTimeout/);
  assert.match(client, /role="combobox"/);
  assert.match(client, /role="listbox"/);
  assert.match(client, /aria-activedescendant/);
  assert.match(client, /detectDictionaryQueryType/);
  assert.match(client, /AbortController/);
});

test("search, filters and pages are URL state and can restore on browser return", () => {
  const client = read("src/app/components/dictionary-search.tsx");
  assert.match(client, /useSearchParams/);
  assert.match(client, /router\.push/);
  assert.match(client, /searchParams\.get\("q"\)/);
  assert.match(client, /searchParams\.get\("level"\)/);
  assert.match(client, /searchParams\.get\("pos"\)/);
  assert.match(client, /searchParams\.get\("page"\)/);
});

test("saved words and Today additions are durable, idempotent learning-state operations", () => {
  const saved = toggleSavedWord(emptyState(), { assetId: "hsk3.word.l1.0001.v1", save: true });
  assert.deepEqual(saved.savedWordIds, ["hsk3.word.l1.0001.v1"]);
  assert.deepEqual(toggleSavedWord(saved, { assetId: "hsk3.word.l1.0001.v1", save: true }).savedWordIds, saved.savedWordIds);
  const added = addWordToToday(saved, { sessionId: "today-1", assetId: "hsk3.word.l1.0001.v1", contentId: "catalog:hsk3.word.l1.0001", contentVersion: "release:v1", title: "学习 xuéxí", href: "/word/xue-xi" });
  const repeated = addWordToToday(added, { sessionId: "today-1", assetId: "hsk3.word.l1.0001.v1", contentId: "catalog:hsk3.word.l1.0001", contentVersion: "release:v1", title: "学习 xuéxí", href: "/word/xue-xi" });
  assert.equal(added.dailySessions[0].items.filter((item) => item.id === "dictionary:hsk3.word.l1.0001.v1").length, 1);
  assert.deepEqual(repeated, added);
  assert.equal(added.dailySessions[0].items.at(-1)?.kind, "summary");
});

test("every browsable catalog result can open a truthful word page and enter Today", async () => {
  const result = await getPublishedWordBySlug("hsk2025.word.l1.0001.v1");
  assert.equal(result.status, "published");
  if (result.status !== "published") return;
  assert.equal(result.item.example, undefined);
  const todayItem = todayContentByAssetId(result.item.id);
  assert.equal(todayItem?.studySlug, result.item.id);
  assert.equal(todayItem?.hanzi, result.item.hanzi);
  const historical = await getPublishedWordBySlug("hsk3.word.l1.0001.v1");
  assert.equal(historical.status, "published");
  const pinned = selectTodayContent(1, 1, { pinnedContentIds: ["catalog:hsk3.word.l1.0001"], freezePinned: true });
  assert.equal(pinned.status, "ready");
  if (pinned.status === "ready") assert.equal(pinned.item.assetId, "hsk3.word.l1.0001.v1");
});

test("a word beyond the bounded runtime index maps to the same Today identity contract", () => {
  const item = todayContentFromCatalogRow({
    id: "hsk3.word.l6.1140.v1",
    release_id: "hsk3-content-truth-v5",
    standard_version: "hsk3",
    content_version: "1",
    level_band: "6",
    hanzi: "最后一词",
    traditional: "最後一詞",
    pinyin: "zuì hòu yī cí",
    meaning: "final catalog word",
    part_of_speech: "noun",
  });
  assert.equal(item.assetId, "hsk3.word.l6.1140.v1");
  assert.equal(item.contentId, "catalog:hsk3.word.l6.1140");
  assert.equal(item.contentVersion, "hsk3-content-truth-v5:1");
  assert.equal(item.studySlug, "hsk3.word.l6.1140.v1");
  assert.equal(item.example, undefined);

  const learningRoute = read("src/app/api/v1/learning/route.ts");
  assert.match(learningRoute, /await resolveTodayDictionaryItem\(assetId\)/);
});

test("catalog detail fallback resolves the active full release without D1", () => {
  const result = findPublicCatalogWordById("hsk3.word.l7.5636.v1");
  assert.equal(result?.id, "hsk3.word.l7.5636.v1");
  assert.equal(result?.release_id, "hsk3-hsk1234-2025-v8");
  assert.equal(result?.level_band, "7-9");
});

test("the unified advanced band accepts canonical l7 IDs without inventing l8 or l9 catalogs", () => {
  assert.equal(isCatalogWordAssetId("hsk3.word.l7.5636.v1"), true);
  assert.equal(isCatalogWordAssetId("hsk3.word.l8.0001.v1"), false);
  assert.equal(isCatalogWordAssetId("hsk3.word.l9.0001.v1"), false);
  assert.equal(isCatalogWordAssetId("hsk3.word.advanced.0001.v1"), false);
});

test("word page removes internal release language and exposes real learning actions", () => {
  const page = read("src/app/word/[slug]/page.tsx");
  const actions = read("src/app/components/dictionary-word-actions.tsx");
  const pronunciation = read("src/app/components/dictionary-pronunciation.tsx");
  assert.doesNotMatch(page, /Study availability|Content QA|Source version|Release/);
  assert.match(page, /DictionaryWordActions/);
  assert.match(pronunciation, /AudioPlaybackControl/);
  assert.match(pronunciation, /AudioButton/);
  assert.doesNotMatch(actions, /Audio unavailable/);
  assert.match(actions, /"Save"/);
  assert.match(actions, /"Add to Today"/);
  assert.match(actions, />Practice this word</);
  assert.match(actions, /\/api\/v1\/learning/);
});

test("related words come only from explicit learner-facing relationships", () => {
  const catalog = read("src/lib/dictionary/catalog.ts");
  const page = read("src/app/word/[slug]/page.tsx");
  assert.match(catalog, /relationship:/);
  assert.match(catalog, /relatedWordsForWord/);
  assert.doesNotMatch(page, /listPublishedWords\(\{ level: word\.level \}\)/);
  assert.match(page, /item\.relationship/);
});

test("mobile and desktop layouts have dedicated result and action treatments", () => {
  const client = read("src/app/components/dictionary-search.tsx");
  const actions = read("src/app/components/dictionary-word-actions.tsx");
  assert.match(client, /md:grid-cols/);
  assert.match(client, /min-h-11/);
  assert.match(actions, /sm:grid-cols-3/);
  assert.match(actions, /min-h-11/);
});
