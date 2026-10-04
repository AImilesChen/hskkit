/** Legacy short drills contain draft mixed-language translations. Do not present them as finished English. */
export function publishableReadingTranslation(value: string): string | null {
  const translation = value.trim();
  return translation && !/\p{Script=Han}/u.test(translation) ? translation : null;
}
