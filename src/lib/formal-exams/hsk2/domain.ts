import type { MockQuestion, MockSession, MockResult } from "../../mock/domain.ts";
import type { ExamPaper, Form, StudentPaper, ExamItem, ExamPhase, FormalView } from "./types.ts";

export const FORMAL_PREFIX = "formal:";
export const EXAM_SECONDS = 55 * 60;
export const isForm = (value: unknown): value is Form => value === "a" || value === "b" || value === "c";
export const formalSession = (session: MockSession) => session.id.startsWith("formal_") && session.questionSetVersion.startsWith(FORMAL_PREFIX);
export const mayOpenPaper = (form: Form, tier: string) => form === "a" || tier === "pro";
export function examPhase(startedAt: string, now: string): ExamPhase {
  const elapsed = (Date.parse(now) - Date.parse(startedAt)) / 1000;
  return elapsed < 1020 ? "listening" : elapsed < 1200 ? "transfer" : elapsed < 2700 ? "reading" : elapsed < EXAM_SECONDS ? "writing" : "expired";
}
export const mediaHref = (paper: ExamPaper, filename: string) => `/api/v1/formal-exams/hsk2/media/${paper.form}/${filename}`;
export function studentPaper(paper: ExamPaper): StudentPaper {
  const item = (q: ExamItem) => ({ id: q.id, number: q.number, stem: q.stem, stemRuby: q.stemRuby, options: q.options, component: q.component ? { imageId: q.component.imageId } : undefined, blankPinyin: q.blankPinyin });
  return { id: paper.id, title: paper.title, version: paper.version, form: paper.form,
    fullAudio: mediaHref(paper, "listening-full.mp3"),
    images: Object.fromEntries(Object.entries(paper.images).map(([id, filename]) => [id, mediaHref(paper, filename)])),
    parts: paper.parts.map(part => ({ id: part.id, section: part.section, title: part.title, instruction: part.instruction,
      sharedOptions: part.sharedOptions,
      example: part.example ? { ...item(part.example), answer: part.example.answer } : null, questions: part.questions.map(item) })) };
}
export function startFormal(paper: ExamPaper, ownerId: string, key: string, now: string): MockSession {
  const questions: MockQuestion[] = paper.parts.flatMap(part => part.questions.map(q => ({
    id: q.id, contentId: q.id, contentVersion: paper.version, sourceReleaseId: paper.id, band: "basic" as const,
    level: 2, levelBand: "2", dimension: part.section, prompt: q.stem,
    options: Object.fromEntries(Object.entries(q.options ?? part.sharedOptions ?? {}).map(([key, opt]) => [key, opt.text ?? opt.imageId ?? key])),
    correctAnswer: q.answer, explanation: q.explanationEn,
    sourceGroupId: `${paper.id}:${part.id}`, approval: "approved" as const, authorization: "authorized" as const, lifecycle: "published" as const,
  })));
  return { id: `formal_${crypto.randomUUID()}`, ownerId, band: "basic", status: "in_progress",
    startIdempotencyKey: `formal:hsk2:${paper.form}:${key}`, questionSetVersion: FORMAL_PREFIX + paper.id,
    scoringVersion: "hsk2-formal-raw-v1", questions, answers: [], answerKeys: [], revision: 0,
    startedAt: now, deadlineAt: new Date(Date.parse(now) + EXAM_SECONDS * 1000).toISOString() };
}
export function saveFormalAnswer(session: MockSession, input: { questionId: string; answer: string; idempotencyKey: string; now: string }): MockSession {
  if (!formalSession(session)) throw new Error("EXAM_NOT_FOUND");
  input = { ...input, answer: input.answer.normalize("NFKC").trim() };
  const old = session.answers.find(a => a.idempotencyKey === input.idempotencyKey);
  if (old) {
    if (old.questionId !== input.questionId || old.answer !== input.answer) throw new Error("IDEMPOTENCY_KEY_REUSED");
    return session;
  }
  if (session.answerKeys.includes(input.idempotencyKey)) throw new Error("IDEMPOTENCY_KEY_REUSED");
  if (session.status !== "in_progress") throw new Error("EXAM_ALREADY_SUBMITTED");
  const phase = examPhase(session.startedAt, input.now);
  if (phase === "expired") throw new Error("EXAM_TIME_EXPIRED");
  const q = session.questions.find(q => q.id === input.questionId);
  if (!q || (q.dimension === "writing" && Object.keys(q.options ?? {}).length === 0 ? input.answer !== "" && !/^[\p{Script=Han}]$/u.test(input.answer) : !Object.hasOwn(q.options ?? {}, input.answer))) throw new Error("INVALID_ANSWER");
  if (!(q.dimension === phase || (q.dimension === "listening" && phase === "transfer"))) throw new Error("SECTION_LOCKED");
  return { ...session, revision: session.revision + 1,
    answers: [...session.answers.filter(a => a.questionId !== input.questionId), { ...input, savedAt: input.now }],
    answerKeys: [...session.answerKeys, input.idempotencyKey] };
}
export function submitFormal(session: MockSession, key: string, now: string): MockSession {
  if (!formalSession(session)) throw new Error("EXAM_NOT_FOUND");
  if (session.status === "submitted") return session;
  const items = session.questions.map(q => {
    const answer = session.answers.find(a => a.questionId === q.id)?.answer;
    return { questionId: q.id, dimension: q.dimension, prompt: q.prompt, answer, correctAnswer: q.correctAnswer,
      correct: answer === q.correctAnswer, explanation: q.explanation };
  });
  const correct = items.filter(q => q.correct).length;
  const result: MockResult = { id: `formal_result_${crypto.randomUUID()}`, sessionId: session.id, band: "basic",
    questionSetVersion: session.questionSetVersion, scoringVersion: session.scoringVersion, submitIdempotencyKey: key,
    correctCount: correct, totalCount: 60, percentage: Math.round(correct / 60 * 100),
    dimensionEvidence: Object.fromEntries(["listening", "reading", "writing"].map(s => [s, { correct: items.filter(q => q.dimension === s && q.correct).length, total: items.filter(q => q.dimension === s).length }])),
    items, questionSnapshots: session.questions, nextRoutes: ["/hsk-test-prep/hsk-2/mock", "/review"],
    disclaimer: "Independent HSKKit practice. Raw marks only; not an official scaled score or pass prediction.", createdAt: now };
  return { ...session, status: "submitted", submittedAt: now, revision: session.revision + 1, result };
}
export function formalView(session: MockSession, paper: ExamPaper, now: string): FormalView {
  if (!formalSession(session) || session.questionSetVersion !== FORMAL_PREFIX + paper.id) throw new Error("EXAM_NOT_FOUND");
  const result = session.result;
  return { id: session.id, form: paper.form, status: session.status, startedAt: session.startedAt, deadlineAt: session.deadlineAt,
    revision: session.revision, serverNow: now, answers: session.answers.map(a => ({ questionId: a.questionId, answer: a.answer })), paper: studentPaper(paper),
    ...(result ? { result: { correct: result.correctCount, total: 60, listening: result.dimensionEvidence.listening?.correct ?? 0,
      reading: result.dimensionEvidence.reading?.correct ?? 0, writing: result.dimensionEvidence.writing?.correct ?? 0, submittedAt: result.createdAt,
      items: result.items.map(item => {
        const q = paper.parts.flatMap(p => p.questions).find(q => q.id === item.questionId)!;
        return { questionId: item.questionId, answer: item.answer, correctAnswer: item.correctAnswer, correct: item.correct,
          explanation: item.explanation, script: q.audioScript ?? [], audioSrc: q.audioSrc ? mediaHref(paper, q.audioSrc.split("/").at(-1)!) : undefined };
      }) } } : {}) };
}
