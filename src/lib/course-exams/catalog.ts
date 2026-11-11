import manifest from "./manifest.json";
import chinese2Manifest from "./chinese2-manifest.json";
import chinese3Manifest from "./chinese3-manifest.json";
import chinese4Manifest from "./chinese4-manifest.json";
export type CourseLevel = 1 | 2 | 3 | 4;
export const COURSE_FORMS = ["a", "b", "c"] as const;
export type CourseForm = typeof COURSE_FORMS[number];
export const COURSE_HREF = "/chinese-course-tests";
export function isCourseForm(value: unknown): value is CourseForm { return typeof value === "string" && COURSE_FORMS.includes(value as CourseForm); }
export function coursePaperHref(form: CourseForm, level: CourseLevel = 1) { return `${COURSE_HREF}/chinese-${level}/${form}`; }
export function coursePracticeHref(form: CourseForm, level: CourseLevel = 1) { return `${coursePaperHref(form, level)}/practice`; }
export function courseFileHref(form: CourseForm, file: string, level: CourseLevel = 1) { return `/api/v1/course-tests/chinese-${level}/${form}/file/${file}`; }
export function courseAsset(form: unknown, path: unknown, level: CourseLevel = 1) {
  if (!isCourseForm(form) || typeof path !== "string" || !/^[A-Za-z0-9_./-]+$/.test(path) || path.split("/").some(p => !p || p === "." || p === "..")) return null;
  const paper = (level === 4 ? chinese4Manifest : level === 3 ? chinese3Manifest : level === 2 ? chinese2Manifest : manifest).papers[form];
  return paper.files.find(f => f.path === path) ? { paper, file: paper.files.find(f => f.path === path)! } : null;
}
