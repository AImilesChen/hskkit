// This module is imported only by server routes. Never import it from a client component.
import a from "./data/a.json";
import b from "./data/b.json";
import c from "./data/c.json";
import type { ExamPaper, Form } from "./types";
export const examPaper = (form: Form): ExamPaper => ({ a, b, c }[form] as unknown as ExamPaper);
