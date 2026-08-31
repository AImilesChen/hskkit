import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const read = (path: string) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("pricing translates AI credits into truthful, bounded learner value", async () => {
  const pricing = await read("src/app/pricing/page.tsx");
  assert.match(pricing, /1 credit per successful AI explanation/i);
  assert.match(pricing, /5 credits per successful study-plan suggestion/i);
  assert.match(pricing, /about 500 explanations or 100 plan suggestions/i);
  assert.match(pricing, /failed AI responses never use credits/i);
  assert.match(pricing, /completed practice and review answers/i);
  assert.match(pricing, /saved weekly plan/i);
  assert.match(pricing, /does not add AI to Dictionary, writing, speaking, or an open-ended chatbot/i);
});

test("pricing shows concrete explanation and study-plan previews before checkout", async () => {
  const pricing = await read("src/app/pricing/page.tsx");
  assert.match(pricing, /Before AI/i);
  assert.match(pricing, /After AI explanation/i);
  assert.match(pricing, /Before AI plan tips/i);
  assert.match(pricing, /After AI plan tips/i);
  assert.equal((pricing.match(/<SubscriptionCheckout /g) ?? []).length, 2);
});

test("Free limits and Focused Review communicate the specific Pro benefit", async () => {
  const learning = await read("src/app/components/learning-dashboard.tsx");
  assert.match(learning, /Free remaining today/i);
  assert.match(learning, /Pro removes the Free daily learning and review limits/i);
  assert.match(learning, /Focused Review · Pro/i);
  assert.match(learning, /Open mistake prioritized|Due memory prioritized/i);
});

test("Review and Mistakes expose one-credit AI explanation only after grounded feedback", async () => {
  const learning = await read("src/app/components/learning-dashboard.tsx");
  const assist = await read("src/app/components/ai-assist.tsx");
  const route = await read("src/app/api/v1/ai/route.ts");
  assert.match(learning, /<AiAssist feature="explanation" reviewCardId=\{activeCard\.id\}/);
  assert.match(learning, /AI explanation available after you retry/i);
  assert.match(assist, /reviewCardId/);
  assert.match(route, /trustedReviewExplanation/);
  assert.match(route, /REVIEW_EXPLANATION_REQUIRES_FEEDBACK/);
});

test("Account turns Pro entitlement into a usable benefit dashboard and checkout onboarding", async () => {
  const account = await read("src/app/account/account-client.tsx");
  assert.match(account, /Pro is ready/i);
  assert.match(account, /Start Focused Review/i);
  assert.match(account, /Open AI Explanation/i);
  assert.match(account, /Open Planner AI tips/i);
  assert.match(account, /credits used/i);
  assert.match(account, /checkout=success/);
});
