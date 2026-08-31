export const WELCOME_TRIAL_DAYS = 7;
export const WELCOME_TRIAL_CREDITS = 20;
export const REFERRAL_QUALIFYING_DAYS = 3;
export const REFERRAL_QUALIFYING_UNITS = 30;
export const REFERRAL_ANNUAL_CREDIT_CAP = 600;
export const REFERRAL_ANNUAL_PROMO_DAY_CAP = 60;
export const OAUTH_REFERRAL_COOKIE = "hskkit_oauth_referral";
export const REFERRAL_DEVICE_COOKIE = "hskkit_ref_device";

export type AccessWindow = { status: "active" | "ended" | "revoked"; endsAt: string | null; aiCredits?: number | null } | null;
export type AccessResolution = { tier: "free" | "pro"; source: "free" | "paid" | "trial" | "promo"; endsAt: string | null; baseAiCredits: number };

const live = (window: AccessWindow, now: Date) => window?.status === "active" && (!window.endsAt || Date.parse(window.endsAt) > now.getTime());

export function resolveAccessSource(input: { paid: AccessWindow; trial: AccessWindow; promo: AccessWindow }, now = new Date()): AccessResolution {
  if (live(input.paid, now)) return { tier: "pro", source: "paid", endsAt: input.paid!.endsAt, baseAiCredits: 500 };
  if (live(input.trial, now)) return { tier: "pro", source: "trial", endsAt: input.trial!.endsAt, baseAiCredits: input.trial!.aiCredits ?? WELCOME_TRIAL_CREDITS };
  if (live(input.promo, now)) return { tier: "pro", source: "promo", endsAt: input.promo!.endsAt, baseAiCredits: 0 };
  return { tier: "free", source: "free", endsAt: null, baseAiCredits: 0 };
}

export function referralQualification(input: { emailVerified: boolean; distinctLearningDays: number; learningUnits: number; riskStatus: "clear" | "review" | "blocked" }) {
  const reasons: string[] = [];
  if (!input.emailVerified) reasons.push("EMAIL_NOT_VERIFIED");
  if (input.distinctLearningDays < REFERRAL_QUALIFYING_DAYS) reasons.push("LEARNING_DAYS_REQUIRED");
  if (input.learningUnits < REFERRAL_QUALIFYING_UNITS) reasons.push("LEARNING_UNITS_REQUIRED");
  if (input.riskStatus !== "clear") reasons.push(input.riskStatus === "blocked" ? "REFERRAL_BLOCKED" : "RISK_REVIEW_REQUIRED");
  return { eligible: reasons.length === 0, reasons };
}

export function referralReward(stage: "qualified" | "paid", referrerHasPaidPro: boolean) {
  const bonusCredits = stage === "qualified" ? 50 : 150;
  const promoDays = referrerHasPaidPro ? 0 : stage === "qualified" ? 3 : 14;
  return { promoDays, bonusCredits };
}

export function addUtcDays(start: Date, days: number) {
  return new Date(start.getTime() + days * 86_400_000).toISOString();
}

export function safeReferralCode(value: unknown) {
  const code = typeof value === "string" ? value.trim().toUpperCase() : "";
  return /^[A-Z0-9]{8,16}$/.test(code) ? code : undefined;
}
