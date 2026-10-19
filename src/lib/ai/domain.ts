import type { Step7Exercise } from "@/lib/learning/step7-content";
import type { StudyPlan } from "@/lib/planner/domain";
import type { ProductCapabilities } from "@/lib/commercial/capabilities";

export const AI_DAILY_ALLOWANCE = 10;
export const AI_RATE_LIMIT_PER_MINUTE = 6;
export const AI_MAX_OUTPUT_TOKENS = 500;
export const AI_MAX_INPUT_CHARS = 6000;
export type AiRuntimePolicy = { dailyAllowance: number; rateLimitPerMinute: number; maxOutputTokens: number };
const integer = (value: string | undefined, fallback: number, minimum: number, maximum: number) => {
  if (!value || !/^\d+$/.test(value)) return fallback;
  const parsed = Number(value);
  return parsed >= minimum && parsed <= maximum ? parsed : fallback;
};
export function aiRuntimePolicy(env: Pick<CloudflareEnv, "AI_DAILY_ALLOWANCE" | "AI_RATE_LIMIT_PER_MINUTE" | "AI_MAX_OUTPUT_TOKENS">): AiRuntimePolicy {
  return {
    dailyAllowance: AI_DAILY_ALLOWANCE,
    rateLimitPerMinute: AI_RATE_LIMIT_PER_MINUTE,
    maxOutputTokens: integer(env.AI_MAX_OUTPUT_TOKENS, AI_MAX_OUTPUT_TOKENS, 64, AI_MAX_OUTPUT_TOKENS),
  };
}

export type ProductAiRuntimePolicy = AiRuntimePolicy & {
  quotaPeriod: "month";
  allowance: number;
  baseAllowance: number;
  rateLimitPerHour: number;
  concurrency: number;
};

export function productAiRuntimePolicy(env: Pick<CloudflareEnv, "AI_DAILY_ALLOWANCE" | "AI_RATE_LIMIT_PER_MINUTE" | "AI_MAX_OUTPUT_TOKENS">, capabilities: ProductCapabilities, baseAllowance = capabilities.aiMonthlyCredits): ProductAiRuntimePolicy {
  return {
    ...aiRuntimePolicy(env),
    quotaPeriod: "month",
    allowance: capabilities.aiMonthlyCredits,
    baseAllowance,
    rateLimitPerHour: capabilities.aiRequestsPerHour,
    concurrency: capabilities.aiConcurrency,
  };
}

export type AiFeature = "explanation" | "study_plan" | "image_mistake";
export type ExplanationOutput = { kind: "explanation"; title: string; summary: string; whyCorrect: string; nextStep: string };
export type StudyPlanOutput = { kind: "study_plan"; title: string; priorities: string[]; nextActions: string[] };
export type ImageMistakeOutput = { kind: "image_mistake"; question: string; answer: string; explanation: string; learnerMistake: string; nextStep: string; confidence: "high" | "medium" };
export type AiOutput = ExplanationOutput | StudyPlanOutput | ImageMistakeOutput;

// A free correction may repair OCR, but must still refer to the same question.
export function sameImageQuestionCorrection(original: string, corrected: string) {
  const normalize = (value: string) => [...value.toLocaleLowerCase().replace(/[\s\p{P}\p{S}]/gu, "")];
  const before = normalize(original);
  const after = normalize(corrected);
  if (before.length < 4 || after.length < 4 || after.length < before.length / 2 || after.length > before.length * 2) return false;
  const counts = new Map<string, number>();
  for (const char of before) counts.set(char, (counts.get(char) ?? 0) + 1);
  let shared = 0;
  for (const char of after) { const left = counts.get(char) ?? 0; if (left > 0) { shared += 1; counts.set(char, left - 1); } }
  return shared >= Math.ceil(Math.min(before.length, after.length) * 0.6);
}

const policy = `Return JSON only. Do not use Markdown or HTML. Never claim official HSK status, official exam endorsement, guaranteed results, or that a learner will pass an exam. Never score pronunciation, speaking accuracy, accent, fluency, or voice quality. Do not invent learner data.`;

export function buildExplanationPrompt(exercise: Step7Exercise, learnerAnswer: string) {
  const options = exercise.options ? Object.entries(exercise.options).map(([key, value]) => `${key}: ${value}`).join("\n") : "Free response";
  const prompt = `You are a Chinese learning assistant. Explain one completed exercise using only the trusted material below.\n${policy}\nQuestion: ${exercise.prompt}\nOptions:\n${options}\nCorrect answer: ${exercise.correctAnswer}\nLearner answer: ${learnerAnswer}\nCanonical explanation: ${exercise.explanation}\nReturn exactly {"title":"...","summary":"...","whyCorrect":"...","nextStep":"..."}.`;
  if (prompt.length > AI_MAX_INPUT_CHARS) throw new Error("AI_INPUT_TOO_LARGE");
  return prompt;
}

export function buildStudyPlanPrompt(plan: StudyPlan) {
  const weakPoints = plan.inputs.weakPoints.length ? plan.inputs.weakPoints.join(", ") : "none recorded";
  const sessions = plan.sessions.map((session) => `Day ${session.day}: ${session.minutes} minutes; ${session.tasks.map((task) => task.title).join(", ")}`).join("\n");
  const prompt = `You are a Chinese learning assistant. Supplement the deterministic study plan below with concise priorities. Do not replace, reschedule, or contradict it.\n${policy}\nGoal: HSK ${plan.inputs.goalLevel}\nTarget date: ${plan.inputs.targetDate}\nCapacity: ${plan.inputs.weeklyMinutes} minutes each week\nDue SRS cards: ${plan.srsLoad.dueCards}\nWeak points: ${weakPoints}\nSaved sessions:\n${sessions}\nReturn exactly {"title":"...","priorities":["..."],"nextActions":["..."]}. Use 2-4 items in each list.`;
  if (prompt.length > AI_MAX_INPUT_CHARS) throw new Error("AI_INPUT_TOO_LARGE");
  return prompt;
}

const unsafe = /(official\s*(hsk|exam|test|endorsement)|guarantee(?:d|s)?\s+(?:you\s+)?(?:will\s+)?pass|will\s+pass\s+(?:the\s+)?(?:hsk|exam)|certified\s+(?:exam|hsk|score)|pronunciation\s+(?:score|rating|accuracy)|speaking\s+(?:score|rating)|accent\s+(?:score|rating)|fluency\s+(?:score|rating)|官方(?:HSK|考试|认证|背书)|保证.{0,8}通过|保过|发音(?:评分|打分|准确率)|口语(?:评分|打分))/iu;
const markdownOrHtml = /(?:```|<\/?[a-z][^>]*>|!\[[^\]]*\]\(|\[[^\]]+\]\([^)]*\))/iu;

function text(value: unknown, min = 2, max = 500) {
  if (typeof value !== "string") throw new Error("AI_OUTPUT_INVALID");
  const clean = value.trim();
  if (clean.length < min || clean.length > max || unsafe.test(clean) || markdownOrHtml.test(clean)) throw new Error(unsafe.test(clean) ? "AI_OUTPUT_UNSAFE" : "AI_OUTPUT_INVALID");
  return clean;
}
function list(value: unknown) {
  if (!Array.isArray(value) || value.length < 2 || value.length > 4) throw new Error("AI_OUTPUT_INVALID");
  return value.map((item) => text(item, 2, 240));
}
function exactKeys(value: Record<string, unknown>, expected: string[]) {
  const actual = Object.keys(value).sort();
  const allowed = [...expected].sort();
  if (actual.length !== allowed.length || actual.some((key, index) => key !== allowed[index])) throw new Error("AI_OUTPUT_INVALID");
}

export function parseAiOutput(feature: AiFeature, raw: string): AiOutput {
  if (raw.length > 8000 || raw.trim() !== raw || raw.startsWith("```")) throw new Error("AI_OUTPUT_INVALID");
  let value: Record<string, unknown>;
  try { value = JSON.parse(raw) as Record<string, unknown>; } catch { throw new Error("AI_OUTPUT_INVALID"); }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("AI_OUTPUT_INVALID");
  if (feature === "explanation") {
    exactKeys(value, ["title", "summary", "whyCorrect", "nextStep"]);
    return { kind: feature, title: text(value.title, 2, 120), summary: text(value.summary), whyCorrect: text(value.whyCorrect), nextStep: text(value.nextStep, 2, 240) };
  }
  if (feature === "image_mistake") {
    exactKeys(value, ["question", "answer", "explanation", "learnerMistake", "nextStep", "confidence"]);
    if (value.confidence !== "high" && value.confidence !== "medium") throw new Error("AI_IMAGE_UNREADABLE");
    const question = text(value.question, 4, 1000);
    const answer = text(value.answer, 1, 500);
    if (!/[\u3400-\u9fff]/u.test(question + answer)) throw new Error("AI_IMAGE_UNREADABLE");
    return { kind: feature, question, answer, explanation: text(value.explanation, 8, 1200), learnerMistake: text(value.learnerMistake, 2, 600), nextStep: text(value.nextStep, 4, 400), confidence: value.confidence };
  }
  exactKeys(value, ["title", "priorities", "nextActions"]);
  return { kind: feature, title: text(value.title, 2, 120), priorities: list(value.priorities), nextActions: list(value.nextActions) };
}

export function nonAiExplanation(exercise: Step7Exercise) {
  return { charged: false as const, title: "Standard explanation", summary: exercise.explanation, links: [{ label: "Review without AI", href: "/review" }, { label: "Open Mistakes", href: "/mistakes" }] };
}

export function nonAiStudyPlan(plannerHref = "/planner", reviewHref = "/review") {
  return { charged: false as const, title: "Deterministic study plan", summary: "Your saved schedule, due SRS load and weak points remain available without AI.", links: [{ label: "Keep using Planner", href: plannerHref }, { label: "Review due cards", href: reviewHref }] };
}
