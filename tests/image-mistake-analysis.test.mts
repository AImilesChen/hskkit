import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { aiCreditCost } from "../src/lib/commercial/capabilities.ts";
import { parseAiOutput, sameImageQuestionCorrection } from "../src/lib/ai/domain.ts";
import { callAiProvider } from "../src/lib/ai/provider.ts";

const sample = JSON.stringify({ question: "他昨天去了哪里？", answer: "学校", explanation: "句子中的地点是学校。", learnerMistake: "Learner answer not provided.", nextStep: "Read the location word again.", confidence: "high" });

test("one clear image analysis costs five credits; unreadable results are rejected before settlement", () => {
  assert.equal(aiCreditCost("image_mistake"), 5);
  assert.equal(parseAiOutput("image_mistake", sample).kind, "image_mistake");
  assert.throws(() => parseAiOutput("image_mistake", sample.replace('"high"', '"low"')), /AI_IMAGE_UNREADABLE/);
  assert.throws(() => parseAiOutput("image_mistake", sample.replace("他昨天去了哪里？", "Where did he go?").replace("学校", "school")), /AI_IMAGE_UNREADABLE/);
  assert.throws(() => parseAiOutput("image_mistake", sample.replace('"high"', '"high","extra":"data"')), /AI_OUTPUT_INVALID/);
});

test("free OCR correction stays tied to the uploaded question", () => {
  assert.equal(sameImageQuestionCorrection("他昨天去了哪里？", "他昨天去哪里？"), true);
  assert.equal(sameImageQuestionCorrection("他昨天去了哪里？", "今天我们学习天气预报和气候"), false);
});

test("vision provider receives a data URL without storing the original image", async () => {
  let sent: any;
  const fakeFetch = async (_url: string | URL | Request, init?: RequestInit) => {
    sent = JSON.parse(String(init?.body));
    return new Response(JSON.stringify({ id: "provider-1", choices: [{ message: { content: sample } }], usage: { prompt_tokens: 12, completion_tokens: 40 } }), { status: 200 });
  };
  const result = await callAiProvider({ apiKey: "test", baseUrl: "https://api.deepseek.com", model: "deepseek-flash" }, "Analyze the image", 500, fakeFetch as typeof fetch, 1000, "data:image/jpeg;base64,/9j/");
  assert.equal(result.content, sample);
  assert.deepEqual(sent.messages[1].content, [{ type: "text", text: "Analyze the image" }, { type: "image_url", image_url: { url: "data:image/jpeg;base64,/9j/" } }]);
});

test("migration admits image operations, preserves old rows, and stores only private text", () => {
  const db = new DatabaseSync(":memory:");
  db.exec(`PRAGMA foreign_keys=ON;
    CREATE TABLE ai_operations (
      id TEXT PRIMARY KEY,owner_id TEXT NOT NULL,feature TEXT NOT NULL CHECK(feature IN ('explanation','study_plan')),
      idempotency_key TEXT NOT NULL,request_hash TEXT NOT NULL,status TEXT NOT NULL CHECK(status IN ('reserved','succeeded','failed')),
      quota_period TEXT NOT NULL,cost_units INTEGER NOT NULL CHECK(cost_units=1),response_json TEXT,failure_code TEXT,
      provider_request_id TEXT,prompt_tokens INTEGER CHECK(prompt_tokens IS NULL OR prompt_tokens>=0),
      completion_tokens INTEGER CHECK(completion_tokens IS NULL OR completion_tokens BETWEEN 0 AND 500),
      created_at TEXT NOT NULL,updated_at TEXT NOT NULL,credit_units INTEGER NOT NULL DEFAULT 1 CHECK(credit_units IN (1,5)),
      base_credit_allowance INTEGER NOT NULL DEFAULT 0 CHECK(base_credit_allowance BETWEEN 0 AND 2000),
      UNIQUE(owner_id,feature,idempotency_key));
    CREATE INDEX idx_ai_operations_owner_time ON ai_operations(owner_id,created_at DESC);
    CREATE INDEX idx_ai_operations_status ON ai_operations(status,updated_at);`);
  db.prepare("INSERT INTO ai_operations(id,owner_id,feature,idempotency_key,request_hash,status,quota_period,cost_units,created_at,updated_at) VALUES('old','user:u','explanation','old-key','hash','succeeded','2026-10',1,'2026-10-01','2026-10-01')").run();
  db.exec(readFileSync(new URL("../migrations/0044_external_image_mistakes.sql", import.meta.url), "utf8"));
  assert.equal((db.prepare("SELECT COUNT(*) AS n FROM ai_operations WHERE id='old'").get() as any).n, 1);
  db.prepare("INSERT INTO ai_operations(id,owner_id,feature,idempotency_key,request_hash,status,quota_period,cost_units,credit_units,created_at,updated_at) VALUES('new','user:u','image_mistake','new-key','hash2','succeeded','2026-10',1,5,'2026-10-02','2026-10-02')").run();
  db.prepare("INSERT INTO external_image_mistakes(id,owner_id,operation_id,question,answer,explanation,learner_mistake,next_step,confidence,created_at,updated_at) VALUES('saved','user:u','new','Question','Answer','Explanation','Mistake','Tip','high','2026-10-02','2026-10-02')").run();
  assert.throws(() => db.prepare("INSERT INTO external_image_mistakes(id,owner_id,operation_id,question,answer,explanation,learner_mistake,next_step,confidence,created_at,updated_at) VALUES('duplicate','user:u','new','Question','Answer','Explanation','Mistake','Tip','high','2026-10-02','2026-10-02')").run());
  const columns = db.prepare("PRAGMA table_info(external_image_mistakes)").all() as Array<{ name: string }>;
  assert.ok(!columns.some(column => /image|blob|object_key/i.test(column.name)));
  db.prepare("DELETE FROM ai_operations WHERE id='new'").run();
  assert.equal((db.prepare("SELECT COUNT(*) AS n FROM external_image_mistakes").get() as any).n, 0);
});
