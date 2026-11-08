import { FREE_CAPABILITIES, PRO_CAPABILITIES, aiCreditCost, type ProductCapabilities } from "./capabilities.ts";
import { SUBSCRIPTION_PLANS, type SubscriptionPlanId } from "./subscription.ts";

export function historyDescription(capabilities: ProductCapabilities) {
  const window = capabilities.historyRetentionDays === null ? "Long-term history" : `${capabilities.historyRetentionDays} days of history`;
  return `${window}, up to ${capabilities.historyMaxEntries.toLocaleString("en-US")} entries`;
}

export function freeStudyDescription(capabilities = FREE_CAPABILITIES) {
  return `${capabilities.dailyNewItems} new items daily. ${capabilities.dailyReviewGrades === null ? "Unlimited standard review of learned items." : `${capabilities.dailyReviewGrades} review ratings daily.`}`;
}

export function annualPriceSummary() {
  const monthly = SUBSCRIPTION_PLANS.pro_monthly.amountCents;
  const yearly = SUBSCRIPTION_PLANS.pro_yearly.amountCents;
  return { monthlyEquivalent: (yearly / 1200).toFixed(2), savingsPercent: Math.round((1 - yearly / (monthly * 12)) * 100) };
}

export const AI_CREDIT_COSTS = Object.freeze({ explanation: aiCreditCost("explanation"), studyPlan: aiCreditCost("study_plan"), imageMistake: aiCreditCost("image_mistake") });

export const FREE_PLAN_BENEFITS = [
  `${FREE_CAPABILITIES.dailyNewItems} new items daily`,
  "Unlimited standard review of learned items",
  "Published HSK vocabulary, Placement and Today",
  "Practice and mistakes",
  "HSK 1 and HSK 2 complete mock exams: Paper A",
  historyDescription(FREE_CAPABILITIES),
  `Sync ${FREE_CAPABILITIES.syncDevices} active device`,
];

export const PRO_PLAN_BENEFITS = [
  { title: "Practise complete HSK 1 and HSK 2 papers", detail: "Papers A, B and C with timed listening, reading, HSK 2 writing and answer explanations" },
  { title: "Learn at your own pace", detail: "Unlimited daily new items and standard review" },
  { title: "Focus on your weak spots", detail: "Focused Review prioritizes unresolved mistakes and due weak memories" },
  { title: "Understand your mistakes", detail: "AI explanations after supported practice and review answers" },
  { title: "Refine your weekly plan", detail: "AI suggestions for the weekly plan you saved" },
  { title: "Keep your learning history", detail: `${historyDescription(PRO_CAPABILITIES)} · ${PRO_CAPABILITIES.syncDevices} active devices` },
];

export const PLAN_COMPARISON = [
  ["New learning items", `${FREE_CAPABILITIES.dailyNewItems} per day`, "Unlimited"],
  ["Standard review of learned items", "Unlimited", "Unlimited"],
  ["Published vocabulary, Placement & Today", "Included", "Included"],
  ["Practice & mistakes", "Included", "Included"],
  ["HSK 1 and HSK 2 complete mock exams", "Paper A", "Papers A, B and C"],
  ["Focused Review", "Not included", "Weak items first"],
  ["Monthly AI credits", "No recurring allowance", `${PRO_CAPABILITIES.aiMonthlyCredits} per month`],
  ["Learning history", historyDescription(FREE_CAPABILITIES), historyDescription(PRO_CAPABILITIES)],
  ["Active sync devices", String(FREE_CAPABILITIES.syncDevices), String(PRO_CAPABILITIES.syncDevices)],
  ["Store PDFs & resource packs", "Purchased separately", "Purchased separately"],
] as const;

export function selectedPricingPlan(value: unknown): SubscriptionPlanId {
  return value === "pro_monthly" ? "pro_monthly" : "pro_yearly";
}

export function pricingReturnTo(planId: SubscriptionPlanId) {
  return `/pricing?plan=${planId}#plans`;
}

export type PricingState = {
  authenticated: boolean;
  statusAvailable: boolean;
  checkoutEnabled: boolean;
  sale: null | { percentOff: number; endAt: string };
  salePrices: Partial<Record<SubscriptionPlanId, number>>;
  subscription: null | { planId: SubscriptionPlanId; status: string; cancelAtPeriodEnd: boolean };
  access: { tier: "free" | "pro"; source: "paid" | "trial" | "promo" | "free"; endsAt: string | null };
};

export function checkoutAction(state: PricingState, planId: SubscriptionPlanId) {
  if (!state.statusAvailable) return "unavailable";
  const subscription = state.subscription;
  if (subscription && ["active", "trialing"].includes(subscription.status)) {
    if (subscription.planId === planId) return "manage";
    if (subscription.planId === "pro_monthly" && planId === "pro_yearly") return subscription.cancelAtPeriodEnd ? "scheduled_cancellation" : "switch_yearly";
    return "manage";
  }
  // Paid access or an unresolved existing subscription must not create a second subscription.
  if (state.access.source === "paid" || (subscription && !["canceled", "incomplete_expired"].includes(subscription.status))) return "manage";
  if (!state.checkoutEnabled) return "checkout_unavailable";
  return state.authenticated ? "checkout" : "sign_in";
}
