import { writeFile } from 'node:fs/promises';
import catalog from '../../src/lib/content/public-catalog-index.json' with { type: 'json' };
import runtime from '../../src/lib/content/runtime-content-index.json' with { type: 'json' };
import legacy1 from '../../src/lib/content/legacy-hsk1-words.json' with { type: 'json' };
import legacy23 from '../../src/lib/content/legacy-hsk23-words.json' with { type: 'json' };
import legacy4 from '../../src/lib/content/legacy-hsk4-words.json' with { type: 'json' };
import legacy5 from '../../src/lib/content/legacy-hsk5-words.json' with { type: 'json' };
import priority from '../../src/lib/dictionary/word-prebuild-priority.json' with { type: 'json' };
import { getPublishedWordBySlug } from '../../src/lib/dictionary/runtime-word.ts';
import { listPublishedWords } from '../../src/lib/dictionary/catalog.ts';

// Derive from the same lookup used by the page, including retained learning IDs.
const candidates = new Set([
  ...catalog.words.map(row => row[0]),
  ...[...legacy1.words, ...legacy23.words, ...legacy4.words, ...legacy5.words].map(row => row[0]),
  ...runtime.dictionaryAssets.map(row => row.id),
  ...Object.values(runtime.runtimeWords).flat().map(row => row.id),
]);
const valid = new Set<string>();
const grouped = new Map<string, number[]>();
for (const id of candidates) {
  if ((await getPublishedWordBySlug(id)).status !== 'published') continue;
  valid.add(id);
  const match = /^(.*)\.(\d+)(\.v\d+)$/.exec(id);
  if (!match) throw new Error(`Unexpected word ID: ${id}`);
  const key = `${match[1]}${match[3]}:${match[2].length}`;
  const list = grouped.get(key) ?? [];
  list.push(Number(match[2])); grouped.set(key, list);
}
const ranges: Record<string, number[][]> = {};
for (const [key, numbers] of [...grouped].sort(([a], [b]) => a.localeCompare(b))) {
  const output: number[][] = [];
  for (const n of [...new Set(numbers)].sort((a, b) => a - b)) {
    const last = output.at(-1);
    if (last && last[1] + 1 === n) last[1] = n;
    else output.push([n, n]);
  }
  ranges[key] = output;
}
const foundation = catalog.words.filter(row => ['1', '2', '3'].includes(row[3])).map(row => row[0]);
// Every active public word is generated in CI, including the long-tail HSK 4–9
// requests that dominated production CPU. Retained learning IDs stay readable.
const selected = [...new Set([...listPublishedWords().map(word => word.slug), ...catalog.words.map(row => row[0]),
  ...priority.slice(0, 256).filter(id => valid.has(id))])];
if (foundation.length !== 1000 || selected.length > 15000) throw new Error('Public word asset generation exceeded its release budget');
const assetGroups = new Map<string, number[]>();
const aliases: string[] = [];
for (const slug of selected) {
  const match = /^(.*)\.(\d+)(\.v\d+)$/.exec(slug);
  if (!match) { aliases.push(slug); continue; }
  const key = `${match[1]}${match[3]}:${match[2].length}`;
  const values = assetGroups.get(key) ?? [];
  values.push(Number(match[2])); assetGroups.set(key, values);
}
const assetRanges: Record<string, number[][]> = {};
for (const [key, values] of [...assetGroups].sort(([a], [b]) => a.localeCompare(b))) {
  const intervals: number[][] = [];
  for (const n of [...new Set(values)].sort((a, b) => a - b)) {
    const last = intervals.at(-1);
    if (last && last[1] + 1 === n) last[1] = n;
    else intervals.push([n, n]);
  }
  assetRanges[key] = intervals;
}
await writeFile(new URL('../../src/lib/runtime/word-route-validity.json', import.meta.url), JSON.stringify(ranges) + '\n');
await writeFile(new URL('../../src/lib/dictionary/word-prebuild-slugs.json', import.meta.url), JSON.stringify(selected) + '\n');
await writeFile(new URL('../../src/lib/runtime/public-word-asset-policy.json', import.meta.url), JSON.stringify({ aliases, ranges: assetRanges }) + '\n');
console.log(`Word routing: ${valid.size} valid IDs in ${Object.keys(ranges).length} groups; ${selected.length} prebuilt detail/practice pairs`);
