import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requestIdentity } from '@/lib/account/identity';
import { loadState, saveState } from '@/lib/learning/storage';
import { withUserD1ReadProtection } from '@/lib/d1/user-protection';
import { mergeToneHistory, parseToneHistory, parseToneSession } from '@/lib/tones/domain';

const json = (value: unknown, status = 200) => NextResponse.json(value, { status, headers: { 'cache-control': 'private, no-store', 'x-robots-tag': 'noindex' } });
export async function GET() {
  try {
    const identity = await requestIdentity();
    if (!identity.account) return json({ scope: 'guest', sessions: [] });
    if (identity.account.status !== 'active') return json({ error: 'ACCOUNT_UNAVAILABLE' }, 403);
    const { state } = await withUserD1ReadProtection(() => loadState(`user:${identity.account!.userId}`));
    return json({ scope: 'account', profile: createHash('sha256').update(identity.account.userId).digest('hex').slice(0, 24), sessions: parseToneHistory(state.toneTrainingSessions) });
  } catch { return json({ error: 'TONE_SYNC_UNAVAILABLE', retryable: true }, 503); }
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  // Next dev can normalize 127.0.0.1 to localhost in nextUrl; compare the
  // actual request Host so legitimate browser requests retain the same origin.
  const host = request.headers.get('host') ?? request.nextUrl.host;
  let validOrigin = !origin;
  try {
    if (origin) { const parsed = new URL(origin); validOrigin = parsed.host === host && (parsed.protocol === 'https:' || (parsed.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(parsed.hostname))); }
  } catch { validOrigin = false; }
  if (!validOrigin || request.headers.get('sec-fetch-site') === 'cross-site') return json({ error: 'INVALID_ORIGIN' }, 403);
  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 100000) return json({ error: 'PAYLOAD_TOO_LARGE' }, 413);
    body = JSON.parse(raw);
  } catch { return json({ error: 'INVALID_JSON' }, 400); }
  const incoming = (body as { sessions?: unknown })?.sessions;
  if (!Array.isArray(incoming) || incoming.length > 20 || incoming.some(s => !parseToneSession(s))) return json({ error: 'INVALID_TONE_SESSIONS' }, 422);
  try {
    const identity = await requestIdentity();
    if (!identity.account) return json({ error: 'SIGN_IN_TO_SYNC' }, 401);
    if (identity.account.status !== 'active') return json({ error: 'ACCOUNT_UNAVAILABLE' }, 403);
    const currentProfile = createHash('sha256').update(identity.account.userId).digest('hex').slice(0, 24);
    if ((body as { profile?: unknown }).profile !== currentProfile) return json({ error: 'ACCOUNT_CHANGED', retryable: false }, 409);
    const ownerId = `user:${identity.account.userId}`;
    for (let attempt = 0; attempt < 3; attempt++) {
      const current = await withUserD1ReadProtection(() => loadState(ownerId));
      const sessions = mergeToneHistory(current.state.toneTrainingSessions ?? [], parseToneHistory(incoming));
      if (JSON.stringify(sessions) === JSON.stringify(current.state.toneTrainingSessions ?? [])) return json({ saved: true, sessions });
      try {
        // Only a separate self-practice history is changed. No attempts, SRS cards,
        // entitlement counters, streaks or word mastery are awarded by this API.
        await saveState(ownerId, { ...current.state, toneTrainingSessions: sessions }, current.revision);
        return json({ saved: true, sessions });
      } catch (error) { if (!(error instanceof Error) || error.message !== 'REVISION_CONFLICT') throw error; }
    }
    return json({ error: 'TONE_SYNC_CONFLICT', retryable: true }, 409);
  } catch { return json({ error: 'TONE_SYNC_UNAVAILABLE', retryable: true }, 503); }
}
