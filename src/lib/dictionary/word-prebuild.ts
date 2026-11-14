import slugs from './word-prebuild-slugs.json' with { type: 'json' };

// Both routes retain their existing renderers. Content changes ship with the
// same versioned JS/CSS and public word assets, rather than regenerating in R2.
export function wordPrebuildParams() {
  return slugs.map(slug => ({ slug }));
}
