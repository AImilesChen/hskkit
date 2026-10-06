import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { ADVANCED_LISTENING_LESSONS, GRAMMAR_LESSONS, READING_LESSONS, trustedStep7Exercise } from "../src/lib/learning/step7-content.ts";
import { isPublishedStep7Content as isPublishedContentLogicalId } from "../src/lib/learning/step7-release.ts";
import practiceAudio from "../src/lib/practice/audio-assets.json" with { type: "json" };
import { AI_DAILY_ALLOWANCE, AI_RATE_LIMIT_PER_MINUTE, aiRuntimePolicy, nonAiExplanation, parseAiOutput } from "../src/lib/ai/domain.ts";
import { callAiProvider } from "../src/lib/ai/provider.ts";
import { readBoundedJsonObject } from "../src/lib/ai/request.ts";

const source = (path: string) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Batch 13 formal Grammar release has one honest lesson for Levels 1–6 and the 7–9 band", () => {
  assert.equal(GRAMMAR_LESSONS.length, 7);
  assert.deepEqual(GRAMMAR_LESSONS.map((item) => item.levelBand), ["1", "2", "3", "4", "5", "6", "7-9"]);
  for (const item of GRAMMAR_LESSONS) {
    assert.ok(isPublishedContentLogicalId(`hsk3.grammar.${item.slug}`));
    assert.ok(item.examples.length >= 2);
    assert.deepEqual(trustedStep7Exercise(item.exercise.id), item.exercise);
  }
});

test("Batch 13 formal Reading release is levelled, typed and difficulty-labelled", () => {
  assert.equal(READING_LESSONS.length, 7);
  assert.deepEqual(READING_LESSONS.map((item) => item.levelBand), ["1", "2", "3", "4", "5", "6", "7-9"]);
  assert.deepEqual(new Set(READING_LESSONS.map((item) => item.questionType)), new Set(["detail", "sequence", "purpose", "inference", "argument", "critical-evaluation"]));
  assert.deepEqual(new Set(READING_LESSONS.map((item) => item.difficulty)), new Set(["easy", "medium", "hard", "advanced"]));
  for (const item of READING_LESSONS) {
    assert.ok(isPublishedContentLogicalId(`hsk3.reading.${item.slug}`));
    assert.ok(item.vocabulary.length >= 3);
    assert.deepEqual(trustedStep7Exercise(item.exercise.id), item.exercise);
  }
});

test("Batch 13 listening release covers L1–9 progression with approved audio", () => {
  assert.equal(ADVANCED_LISTENING_LESSONS.length, 9);
  assert.deepEqual(ADVANCED_LISTENING_LESSONS.map((item) => item.level), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.deepEqual(ADVANCED_LISTENING_LESSONS.slice(0, 3).map((item) => item.trainingType), ["tone", "syllable", "basic-dictation"]);
  assert.deepEqual(ADVANCED_LISTENING_LESSONS.slice(3, 6).map((item) => item.trainingType), ["sentence", "paragraph", "context"]);
  assert.ok(ADVANCED_LISTENING_LESSONS.slice(6).every((item) => item.register === "formal" && item.voiceText.length >= 35));
  const approvedPaths = new Set(practiceAudio.assets.filter((asset) => asset.authorization.status === "authorized" && asset.qaStatus === "approved" && asset.lifecycleStatus === "published").map((asset) => `/${asset.storageKey}`));
  for (const item of ADVANCED_LISTENING_LESSONS) {
    assert.ok(item.audioSrc.startsWith("/audio/formal/") || approvedPaths.has(item.audioSrc));
    assert.deepEqual(trustedStep7Exercise(item.exercise.id), item.exercise);
  }
  const level2 = ADVANCED_LISTENING_LESSONS[1];
  assert.equal(level2.voiceText, "老师让我们练习发音。");
  assert.equal(level2.exercise.prompt, "Which phrase did you hear?");
  assert.equal(level2.exercise.options?.A, "老师让我们练习发音。");
  const level3 = ADVANCED_LISTENING_LESSONS[2];
  assert.equal(level3.voiceText, "每天早上，林月先复习十个生词，再听十五分钟中文。她把不懂的句子写在本子上，晚上再看一遍。");
  assert.equal(level3.exercise.prompt, "Type the first sentence you hear.");
  assert.equal(level3.exercise.correctAnswer, "每天早上林月先复习十个生词再听十五分钟中文");
});

test("Batch 13 publication event and compatibility exports are wired", async () => {
  const catalog = JSON.parse(await source("src/lib/content/catalog.json"));
  assert.deepEqual(catalog.releaseEvents.at(-1), {
    action: "publish",
    releaseId: "hsk3-content-truth-v5",
    standard: "hsk3",
    at: "2026-08-25T03:05:24.000Z",
    previousActiveReleaseId: "hsk3-batch13-formal-learning-v4",
  });
  const module = await import("../src/lib/learning/step7-content.ts");
  assert.equal(module.publishedGrammarLessons.length, 7);
  assert.equal(module.publishedReadingLessons.length, 7);
  assert.equal(module.grammarBySlug("basic-shi-negation")?.slug, "basic-shi-negation");
  assert.equal(module.readingBySlug("family-weekend-plan")?.slug, "family-weekend-plan");
  assert.equal(module.GRAMMAR_LESSONS[0].contentVersion, module.GRAMMAR_LESSONS[0].exercise.contentVersion);
  assert.equal(module.GRAMMAR_LESSONS[0].relatedReadingSlug, module.GRAMMAR_LESSONS[0].readingSlug);
  assert.equal(module.GRAMMAR_LESSONS[0].examples[0].chinese, module.GRAMMAR_LESSONS[0].examples[0].zh);
  assert.equal(module.READING_LESSONS[0].passage, module.READING_LESSONS[0].text);
  assert.equal(module.READING_LESSONS[0].relatedGrammarSlug, module.READING_LESSONS[0].grammarSlug);
  assert.equal(module.READING_LESSONS[0].vocabulary[0].hanzi, module.READING_LESSONS[0].vocabulary[0].word);
  assert.equal(typeof module.READING_LESSONS[0].pinyin, "string");
  assert.equal(module.ADVANCED_LISTENING_LESSONS[0].contentVersion, module.ADVANCED_LISTENING_LESSONS[0].exercise.contentVersion);
  assert.equal(module.ADVANCED_LISTENING_LESSONS[0].guidance, module.ADVANCED_LISTENING_LESSONS[0].instruction);
});

test("all three formal modules use the shared attempt Mistakes SRS Today path", async () => {
  const client = await source("src/app/components/step7-exercise.tsx");
  const learning = await source("src/lib/learning/domain.ts");
  assert.match(client, /action:\s*"step7_attempt"/);
  assert.match(learning, /recordAttempt/);
  assert.match(learning, /mistakes/);
  assert.match(learning, /applyAttemptToSessions/);
  assert.match(learning, /cards/);
});

test("AI is account-only and keeps deterministic fallback/report actions", async () => {
  assert.equal(AI_DAILY_ALLOWANCE, 10);
  assert.equal(AI_RATE_LIMIT_PER_MINUTE, 6);
  const route = await source("src/app/api/v1/ai/route.ts");
  const component = await source("src/app/components/ai-assist.tsx");
  const storage = await source("src/lib/ai/storage.ts");
  assert.match(route, /AI_ACCOUNT_REQUIRED/);
  assert.match(route, /status:\s*401|,\s*401\)/);
  assert.match(component, /Report an AI response/);
  assert.deepEqual(nonAiExplanation(GRAMMAR_LESSONS[0].exercise).links.map((link) => link.href), ["/review", "/mistakes"]);
  assert.deepEqual(aiRuntimePolicy({ AI_DAILY_ALLOWANCE: "50", AI_RATE_LIMIT_PER_MINUTE: "20", AI_MAX_OUTPUT_TOKENS: "500" }), {
    dailyAllowance: 10,
    rateLimitPerMinute: 6,
    maxOutputTokens: 500,
  });
  assert.match(storage, /dailyAllowance:\s*AI_DAILY_ALLOWANCE/);
  assert.match(storage, /rateLimitPerMinute:\s*AI_RATE_LIMIT_PER_MINUTE/);
  assert.match(storage, /ON CONFLICT\(owner_id,period_key\) DO UPDATE SET allowance=MAX\(ai_quota_buckets\.allowance,excluded\.allowance,used\+reserved\)/);
  assert.match(storage, /reserved=0/);
  assert.match(storage, /AI_REQUEST_IN_PROGRESS/);
});

test("AI request reader rejects declared and chunked oversized bodies before full allocation", async () => {
  await assert.rejects(() => readBoundedJsonObject(new Request("https://hskkit.com/api", {
    method: "POST", headers: { "content-length": "1025" }, body: "{}",
  }), 1024), /PAYLOAD_TOO_LARGE/);
  const oversized = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(`{"value":"${"汉".repeat(342)}"}`));
      controller.close();
    },
  });
  await assert.rejects(() => readBoundedJsonObject(new Request("https://hskkit.com/api", { method: "POST", body: oversized, duplex: "half" } as RequestInit), 1024), /PAYLOAD_TOO_LARGE/);
  const exact = JSON.stringify({ value: "x".repeat(1012) });
  assert.equal(new TextEncoder().encode(exact).byteLength, 1024);
  assert.equal((await readBoundedJsonObject(new Request("https://hskkit.com/api", { method: "POST", body: exact }), 1024)).value, "x".repeat(1012));
});

test("AI provider output rejects unknown fields", () => {
  assert.throws(() => parseAiOutput("explanation", JSON.stringify({ title: "Title", summary: "Summary", whyCorrect: "Reason", nextStep: "Review", extra: true })), /AI_OUTPUT_INVALID/);
  assert.throws(() => parseAiOutput("study_plan", JSON.stringify({ title: "Title", priorities: ["One", "Two"], nextActions: ["One", "Two"], extra: true })), /AI_OUTPUT_INVALID/);
});

test("shared navigation exposes Grammar and Reading indexes", async () => {
  const navigation = await source("src/app/site-navigation.ts");
  assert.match(navigation, /href:\s*"\/grammar",\s*label:\s*"Grammar"/);
  assert.match(navigation, /href:\s*"\/reading",\s*label:\s*"Reading"/);
});

test("AI provider retries one transient failure only and never retries invalid output", async () => {
  const config = { apiKey: "test", baseUrl: "https://api.deepseek.com", model: "deepseek-flash" } as const;
  let attempts = 0;
  const recovered = await callAiProvider(config, "trusted", 100, async () => {
    attempts += 1;
    if (attempts === 1) return new Response("busy", { status: 503 });
    return new Response(JSON.stringify({ id: "ok", choices: [{ message: { content: "{\"title\":\"T\"}" } }], usage: { completion_tokens: 10 } }), { status: 200 });
  });
  assert.equal(attempts, 2);
  assert.equal(recovered.providerRequestId, "ok");
  attempts = 0;
  await assert.rejects(() => callAiProvider(config, "trusted", 100, async () => { attempts += 1; return new Response("bad", { status: 400 }); }), /AI_PROVIDER_UNAVAILABLE/);
  assert.equal(attempts, 1);
});

test("Batch 13 dynamic AI path uses a release-gated lightweight Step 7 manifest", async () => {
  const step7Source = await source("src/lib/learning/step7-content.ts");
  assert.doesNotMatch(step7Source, /content\/published-content|content\/catalog\.json/);
  const storageSource = await source("src/lib/learning/storage.ts");
  assert.match(storageSource, /import type \{ LearningState \} from \"\.\/domain\"/);
  assert.doesNotMatch(storageSource, /import \{[^}]*emptyLearningState[^}]*\} from \"\.\/domain\"/);

  const manifest = await import("../src/lib/learning/step7-release.ts");
  const catalog = JSON.parse(await source("src/lib/content/catalog.json"));
  const release = catalog.releases.find((item: { id: string }) => item.id === catalog.activeReleaseByStandard.hsk3);
  assert.equal(release?.id, "hsk3-content-truth-v5");
  assert.equal(release?.standard, "hsk3");
  assert.equal(release?.status, "published");
  assert.equal(manifest.STEP7_RELEASE_ID, catalog.activeReleaseByStandard.hsk3);
  assert.deepEqual(
    new Set(manifest.STEP7_PUBLISHED_CONTENT_LOGICAL_IDS),
    new Set([
      ...GRAMMAR_LESSONS.map((item) => `hsk3.grammar.${item.slug}`),
      ...READING_LESSONS.map((item) => `hsk3.reading.${item.slug}`),
    ]),
  );
  assert.deepEqual(new Set(Object.keys(manifest.STEP7_PUBLISHED_AUDIO_BY_LOGICAL_ID)), new Set([
    "hsk3.audio.word-mai",
    "hsk3.audio.sentence-pronunciation",
    "hsk3.audio.context-morning-study",
  ]));
  assert.equal(manifest.isPublishedStep7Content("hsk3.grammar.not-released"), false);
  assert.equal(manifest.publishedStep7AudioSrc("hsk3.audio.not-released"), undefined);
  const contentIds = new Set(release.contentAssetIds);
  const audioIds = new Set(release.audioAssetIds);

  for (const logicalId of manifest.STEP7_PUBLISHED_CONTENT_LOGICAL_IDS) {
    const asset = catalog.contentAssets.find((item: { logicalId: string }) => item.logicalId === logicalId);
    assert.ok(asset && contentIds.has(asset.id));
    assert.equal(asset.standard, "hsk3");
    assert.equal(asset.authorization.status, "authorized");
    assert.equal(asset.qaStatus, "approved");
    assert.equal(asset.publish_status, "published");
  }
  for (const [logicalId, storageKey] of Object.entries(manifest.STEP7_PUBLISHED_AUDIO_BY_LOGICAL_ID)) {
    const asset = catalog.audioAssets.find((item: { logicalId: string }) => item.logicalId === logicalId);
    assert.ok(asset && audioIds.has(asset.id));
    assert.equal(asset.standard, "hsk3");
    assert.equal(asset.authorization.status, "authorized");
    assert.equal(asset.qaStatus, "approved");
    assert.equal(asset.usageRights.streaming, true);
    assert.equal(asset.withdrawnAt, undefined);
    assert.equal(storageKey, asset.storageKey);
  }
});
