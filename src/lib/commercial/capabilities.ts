import type { AiFeature } from "../ai/domain";

export type CapabilityTier = "free" | "pro";
export type ProductCapabilities = {
  tier: CapabilityTier;
  dailyNewItems: number | null;
  dailyReviewGrades: number | null;
  syncDevices: number;
  historyMaxEntries: number;
  historyRetentionDays: number | null;
  focusedReview: boolean;
  aiMonthlyCredits: number;
  aiRequestsPerHour: number;
  aiConcurrency: number;
};

export const FREE_CAPABILITIES: ProductCapabilities = Object.freeze({
  tier: "free",
  dailyNewItems: 10,
  dailyReviewGrades: 20,
  syncDevices: 1,
  historyMaxEntries: 100,
  historyRetentionDays: 7,
  focusedReview: false,
  aiMonthlyCredits: 0,
  aiRequestsPerHour: 0,
  aiConcurrency: 0,
});

export const PRO_CAPABILITIES: ProductCapabilities = Object.freeze({
  tier: "pro",
  dailyNewItems: null,
  dailyReviewGrades: null,
  syncDevices: 3,
  historyMaxEntries: 10_000,
  historyRetentionDays: null,
  focusedReview: true,
  aiMonthlyCredits: 500,
  aiRequestsPerHour: 10,
  aiConcurrency: 1,
});

type EntitlementInput = { status: "active" | "suspended" | "ended" | "revoked"; endsAt: string | null } | null;

export function capabilitiesForEntitlement(entitlement: EntitlementInput, now = new Date()): ProductCapabilities {
  if (entitlement?.status !== "active") return FREE_CAPABILITIES;
  if (entitlement.endsAt) {
    const endsAt = new Date(entitlement.endsAt).getTime();
    if (!Number.isFinite(endsAt) || endsAt <= now.getTime()) return FREE_CAPABILITIES;
  }
  return PRO_CAPABILITIES;
}

export function usagePeriodKey(period: "day" | "month", now = new Date()) {
  return period === "day" ? now.toISOString().slice(0, 10) : now.toISOString().slice(0, 7);
}

export function aiCreditCost(feature: AiFeature) {
  return feature === "study_plan" ? 5 : 1;
}

export function historyWindow<T extends { observedAt: string }>(rows: T[], capabilities: ProductCapabilities, now = new Date()) {
  const cutoff = capabilities.historyRetentionDays === null ? null : now.getTime() - capabilities.historyRetentionDays * 86_400_000;
  return [...rows]
    .filter((row) => cutoff === null || new Date(row.observedAt).getTime() >= cutoff)
    .sort((a, b) => b.observedAt.localeCompare(a.observedAt))
    .slice(0, capabilities.historyMaxEntries);
}
