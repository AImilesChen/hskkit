import validity from './word-route-validity.json' with { type: 'json' };
import practiceValidity from './word-practice-route-validity.json' with { type: 'json' };

const ranges: Record<string, number[][]> = validity;
const practiceRanges: Record<string, number[][]> = practiceValidity;
function inRanges(id: string, allowed: Record<string, number[][]>): boolean {
  const match = /^(.*)\.(\d+)(\.v\d+)$/.exec(id);
  if (!match) return false;
  const n = Number(match[2]);
  return (allowed[`${match[1]}${match[3]}:${match[2].length}`] ?? []).some(([start, end]) => n >= start && n <= end);
}

export const knownStructuredWordId = (id: string): boolean => inRanges(id, ranges);
export const knownStructuredWordPracticeId = (id: string): boolean => inRanges(id, practiceRanges);

// Called only after normal middleware, preserving redirects and crawler/media guards.
// Flight, actions, encoded paths and unusual methods retain the existing Next path.
export function missingWordResponse(request: Request, html: string): Response | undefined {
  if (request.method !== 'GET' && request.method !== 'HEAD') return;
  if (['rsc', 'next-action', 'next-router-prefetch', 'next-router-segment-prefetch', 'x-prerender-revalidate']
    .some(header => request.headers.has(header))) return;
  const url = new URL(request.url);
  if (url.searchParams.has('_rsc') || request.headers.get('cookie')?.match(/__prerender_bypass|__next_preview_data/)) return;
  const match = /^\/word\/((?:hsk3|hsk2025)\.word\.l[1-7]\.\d{4,5}\.v\d+)(\/practice)?$/.exec(url.pathname);
  if (!match) return;
  // A retained word can still have a readable detail page without a current
  // practice context. Match the practice page's existing notFound decision.
  if (match[2] ? knownStructuredWordPracticeId(match[1]) : knownStructuredWordId(match[1])) return;
  return new Response(request.method === 'HEAD' ? null : html, {
    status: 404,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=86400',
      'x-robots-tag': 'noindex, nofollow',
      vary: 'RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch, Next-Url',
    },
  });
}
