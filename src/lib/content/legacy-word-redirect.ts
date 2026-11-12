import redirects from "./legacy-word-redirects.json" with { type: "json" };

const targets: Readonly<Record<string, string>> = redirects;

export function legacyWordRedirect(pathname: string): string | undefined {
  return Object.hasOwn(targets, pathname) ? targets[pathname] : undefined;
}
