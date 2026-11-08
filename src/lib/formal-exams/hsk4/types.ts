export type Form = "a" | "b" | "c";
export type RubyToken = { text: string; pinyin: string };
export type ExamOption = { text?: string; ruby?: RubyToken[]; imageId?: string };
export type ExamItem = {
  id: string; passageId?: string; number?: number; stem: string; stemRuby: RubyToken[];
  options: Record<string, ExamOption> | null;
  answer: string; explanation: string; explanationEn: string;
  essay?: { minimumChineseCharacters: number; referenceAnswer?: string; requiresHumanReview?: boolean };
  writing?: { imageId: string; keyword: string; referenceAnswer?: string; acceptedExamples?: string[]; requiresHumanReview?: boolean }; component?: { imageId: string }; blankPinyin?: string; audioSrc?: string; audioScript?: { speaker: string; text: string; ruby?: RubyToken[] }[];
};
export type ExamPart = {
  id: string; section: "listening" | "reading" | "writing"; title: string; instruction: string;
  sharedOptions: Record<string, ExamOption> | null; example: ExamItem | null; questions: ExamItem[];
};
export type ExamPaper = { id: string; title: string; version: string; form: Form; parts: ExamPart[]; images: Record<string, string> };
export type StudentItem = Pick<ExamItem, "id" | "number" | "stem" | "stemRuby" | "options" | "component" | "blankPinyin" | "writing" | "essay" | "passageId">;
export type StudentPart = Omit<ExamPart, "questions" | "example"> & {
  example: StudentItem & { answer: string; audioSrc?: string } | null; questions: StudentItem[];
};
export type StudentPaper = Omit<ExamPaper, "parts"> & { parts: StudentPart[]; fullAudio: string };
export type ExamPhase = "listening" | "transfer" | "reading" | "writing" | "expired";
export type FormalView = {
  id: string; form: Form; status: "in_progress" | "submitted"; startedAt: string; deadlineAt: string;
  revision: number; serverNow: string; answers: { questionId: string; answer: string }[];
  paper: StudentPaper;
  result?: { correct: number; total: number; listening: number; reading: number; writing: number; submittedAt: string;
    items: { questionId: string; answer?: string; correctAnswer: string; correct: boolean | null; manual?: boolean; explanation: string;
      script: { text: string; ruby?: RubyToken[] }[]; audioSrc?: string }[] };
};
