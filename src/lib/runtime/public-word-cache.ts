import type { IncrementalCache } from '@opennextjs/aws/types/overrides.js';
import policy from './public-word-asset-policy.json' with { type: 'json' };

const aliases = new Set(policy.aliases);
const ranges: Record<string, number[][]> = policy.ranges;

// The compact policy is generated from exactly the same slugs as Next's SSG.
// Do not import the catalog or its runtime indexes into the lightweight worker.
export function publicWordAssetKey(key: string, cacheType = 'cache'): boolean {
  if (cacheType !== 'cache') return false;
  const route = /^\/?word\/([^/%?#]+)(?:\/practice)?$/.exec(key);
  if (!route) return false;
  const slug = route[1];
  if (aliases.has(slug)) return true;
  const match = /^(.*)\.(\d+)(\.v\d+)$/.exec(slug);
  if (!match) return false;
  const number = Number(match[2]);
  return (ranges[`${match[1]}${match[3]}:${match[2].length}`] ?? [])
    .some(([first, last]) => number >= first && number <= last);
}

export function publicWordCache(assets: IncrementalCache, fallback: IncrementalCache): IncrementalCache {
  return {
    name: 'hskkit-public-word-assets',
    get(key, cacheType) {
      return publicWordAssetKey(key, cacheType) ? assets.get(key, cacheType) : fallback.get(key, cacheType);
    },
    async set(key, value, cacheType) {
      // These immutable entries must have shipped with the build. Never grow
      // the R2 bucket with another copy, including when Next attempts a write.
      if (!publicWordAssetKey(key, cacheType)) await fallback.set(key, value, cacheType);
    },
    async delete(key) {
      if (!publicWordAssetKey(key)) await fallback.delete(key);
    },
  };
}
