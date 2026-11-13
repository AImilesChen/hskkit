import validity from './word-route-validity.json' with { type: 'json' };

const ranges: Record<string, number[][]> = validity;
export function knownStructuredWordId(id: string): boolean {
  const match = /^(.*)\.(\d+)(\.v\d+)$/.exec(id);
  if (!match) return false;
  const n = Number(match[2]);
  return (ranges[`${match[1]}${match[3]}:${match[2].length}`] ?? []).some(([start, end]) => n >= start && n <= end);
}

// Called only after normal middleware, preserving redirects and crawler/media guards.
// Flight, actions, encoded paths and unusual methods retain the existing Next path.
export function missingWordResponse(request: Request, html: string): Response | undefined {
  if (request.method !== 'GET' && request.method !== 'HEAD') return;
  if (['rsc', 'next-action', 'next-router-prefetch', 'next-router-segment-prefetch', 'x-prerender-revalidate']
    .some(header => request.headers.has(header))) return;
  const url = new URL(request.url);
  if (url.searchParams.has('_rsc') || request.headers.get('cookie')?.match(/__prerender_bypass|__next_preview_data/)) return;
  const match = /^\/word\/((?:hsk3|hsk2025)\.word\.l[1-7]\.\d{4,5}\.v\d+)(?:\/practice)?$/.exec(url.pathname);
  if (!match || knownStructuredWordId(match[1])) return;
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
