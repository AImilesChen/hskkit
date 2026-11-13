import slugs from './word-prebuild-slugs.json' with { type: 'json' };

// Both routes keep their existing renderers and 24-hour revalidation policy.
export function wordPrebuildParams() {
  return slugs.map(slug => ({ slug }));
}
