import manifest from "./manifest.json";
export const COURSE_FORMS = ["a", "b", "c"] as const;
export type CourseForm = typeof COURSE_FORMS[number];
export const COURSE_HREF = "/chinese-course-tests";
export function isCourseForm(value: unknown): value is CourseForm { return typeof value === "string" && COURSE_FORMS.includes(value as CourseForm); }
export function coursePaperHref(form: CourseForm) { return `${COURSE_HREF}/chinese-1/${form}`; }
export function coursePracticeHref(form: CourseForm) { return `${coursePaperHref(form)}/practice`; }
export function courseFileHref(form: CourseForm, file: string) { return `/api/v1/course-tests/chinese-1/${form}/file/${file}`; }
export function courseAsset(form: unknown, path: unknown) {
  if (!isCourseForm(form) || typeof path !== "string" || !/^[A-Za-z0-9_./-]+$/.test(path) || path.split("/").some(p => !p || p === "." || p === "..")) return null;
  const paper = manifest.papers[form];
  return paper.files.find(f => f.path === path) ? { paper, file: paper.files.find(f => f.path === path)! } : null;
}
