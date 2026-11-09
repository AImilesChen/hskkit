import manifest from "./manifest.json";
export const AP_FORMS = ["a", "b", "c"] as const;
export type ApForm = typeof AP_FORMS[number];
export const AP_HREF = "/ap-chinese-practice-test";
export function isApForm(value: unknown): value is ApForm { return typeof value === "string" && AP_FORMS.includes(value as ApForm); }
export function apPaperHref(form: ApForm) { return `${AP_HREF}/${form}`; }
export function apPracticeHref(form: ApForm) { return `${apPaperHref(form)}/practice`; }
export function apFileHref(form: ApForm, file: string) { return `/api/v1/ap-chinese/2027/${form}/file/${file}`; }
export function apAsset(form: unknown, path: unknown) {
  if (!isApForm(form) || typeof path !== "string" || !/^[A-Za-z0-9_./-]+$/.test(path) || path.split("/").some(p => !p || p === "." || p === "..")) return null;
  const paper = manifest.papers[form];
  return paper.files.find(f => f.path === path) ? { paper, file: paper.files.find(f => f.path === path)! } : null;
}
