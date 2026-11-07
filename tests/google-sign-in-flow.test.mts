import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';
import { build } from 'esbuild';
import { canReuseGoogleSession, encodeSignInReturnTo, googleReturnDestination, googleSignInHref, signInReturnFromPage, signInReturnTo } from '../src/lib/account/sign-in.ts';

test('sign-in preserves learning query and anchor while rejecting external and authentication return loops', () => {
  const learning = '/reading/article/a-market-morning?view=pinyin#vocabulary';
  assert.equal(signInReturnTo(learning), learning);
  assert.equal(signInReturnTo('/?hskkit_signed_in=1&level=3#tools'), '/?level=3#tools');
  for (const path of [undefined, 'https://other.example', '//other.example', '/\\other.example', '/%5cother.example', '/%2fother.example', '/login', '/login/?returnTo=/', '/%6cogin', '/logout', '/api/v1/auth/google/callback', '/%61pi/v1/auth/google/start', '/%zz']) {
    assert.equal(signInReturnTo(path), '/account', String(path));
  }
  assert.equal(signInReturnFromPage(`/login?returnTo=${encodeURIComponent(learning)}&error=google_failed`), learning);
  assert.equal(signInReturnFromPage('/login?returnTo=%2Flogin'), '/account');
  assert.equal(signInReturnFromPage(learning), learning);
  const normal = new URL(googleSignInHref(learning), 'https://hskkit.test');
  assert.equal(normal.pathname, '/api/v1/auth/google/start');
  assert.equal(signInReturnTo(normal.searchParams.get('returnTo')), learning);
  assert.equal(normal.searchParams.has('selectAccount'), false);
  assert.equal(new URL(googleSignInHref(learning, true), normal).searchParams.get('selectAccount'), '1');
});

test('return URL transport survives decoded query reconstruction, including Unicode and reserved characters', () => {
  for (const path of ['/today?level=2&view=pinyin#task', '/dictionary?q=学习&source=header#results', '/reading?query=a%2Bb%26c#words']) {
    const value = encodeSignInReturnTo(path);
    assert.match(value, /^v1\.[A-Za-z0-9_-]+$/);
    assert.equal(signInReturnTo(value), new URL(path, 'https://hskkit.test').pathname + new URL(path, 'https://hskkit.test').search + new URL(path, 'https://hskkit.test').hash);
    assert.equal(signInReturnFromPage('/login?returnTo=' + value), signInReturnTo(path));
  }
  for (const value of ['v1.%', 'v1._w', 'v1.' + btoa('https://other.example')]) assert.equal(signInReturnTo(value), '/account');
});

test('only a validated active Google session skips OAuth; guest review is optional and retains the anchor', () => {
  assert.equal(canReuseGoogleSession({ connection: 'google', account: { status: 'active' } }, false), true);
  for (const identity of [undefined, {}, { connection: 'sync_key', account: { status: 'active' } }, { connection: 'google', account: { status: 'deleted' } }]) {
    assert.equal(canReuseGoogleSession(identity, false), false);
  }
  assert.equal(canReuseGoogleSession({ connection: 'google', account: { status: 'active' } }, true), false);
  assert.equal(googleReturnDestination('/today?level=2#task', true), '/today?level=2&hskkit_signed_in=1#task');
  assert.equal(googleReturnDestination('/today#task', false), '/today#task');
  assert.equal(googleReturnDestination('/account#guest-progress', true), '/account#guest-progress');
});

// Execute the real route handlers and OAuth implementation, replacing only platform
// cookies, credentials and persistence. No real provider or database is contacted.
const fixture = {
  jar: new Map<string, string>(),
  identity: undefined as { connection?: string; account?: { status: string } } | undefined,
  identityFails: false,
  identityReads: 0,
  configured: true,
  writes: [] as string[],
};
(globalThis as typeof globalThis & { __hskSignInFixture: typeof fixture }).__hskSignInFixture = fixture;
const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const mocks: Record<string, string> = {
  'next/headers': `export const cookies = async () => ({get: key => {const value=globalThis.__hskSignInFixture.jar.get(key);return value===undefined?undefined:{value};}});`,
  '@opennextjs/cloudflare': `export function getCloudflareContext(){return {env:globalThis.__hskSignInFixture.configured?{GOOGLE_CLIENT_ID:'test-client',GOOGLE_CLIENT_SECRET:'test-secret',GOOGLE_REDIRECT_URI:'https://hskkit.test/api/v1/auth/google/callback'}:{}};}`,
  '@/lib/account/identity': `
    export const SESSION_COOKIE='hskkit_session',GUEST_COOKIE='hskkit_guest',OAUTH_STATE_COOKIE='hskkit_oauth_state',OAUTH_VERIFIER_COOKIE='hskkit_oauth_verifier',OAUTH_RETURN_COOKIE='hskkit_oauth_return',OAUTH_SWITCH_COOKIE='hskkit_oauth_switch';
    export async function requestIdentity(){const f=globalThis.__hskSignInFixture;f.identityReads++;if(f.identityFails)throw Error('D1 unavailable');return f.identity;}`,
  '@/lib/account/storage': `
    export async function upsertGoogleAccount(profile,timezone){globalThis.__hskSignInFixture.writes.push('account');return {userId:'test-user',timezone};}
    export async function createAccountSession(){globalThis.__hskSignInFixture.writes.push('session');return {sessionToken:'test-session',expiresAt:'2026-12-07T00:00:00Z'};}
    export async function updateTimezone(){globalThis.__hskSignInFixture.writes.push('timezone');}
    export function validTimezone(value){return value==='Europe/London';}`,
  '@/lib/commercial/referral-storage': `export async function activateWelcomeTrialAndReferral(){globalThis.__hskSignInFixture.writes.push('trial');} export async function sha256ReferralDevice(){return 'test-device-hash';}`,
};
const bundled = await build({
  stdin: { contents: `export {GET as start} from './src/app/api/v1/auth/google/start/route.ts'; export {GET as callback} from './src/app/api/v1/auth/google/callback/route.ts';`, resolveDir: root, loader: 'ts' },
  bundle: true, write: false, platform: 'node', format: 'esm', target: 'node22',
  plugins: [{ name: 'platform-fixture', setup(builder) {
    builder.onResolve({ filter: /^next\/server$/ }, () => ({ path: pathToFileURL(require.resolve('next/server.js')).href, external: true }));
    builder.onResolve({ filter: /^(next\/headers|@opennextjs\/cloudflare|@\/lib\/account\/(?:identity|storage)|@\/lib\/commercial\/referral-storage)$/ }, args => ({ path: args.path, namespace: 'fixture' }));
    builder.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ contents: mocks[args.path], loader: 'js' }));
  } }],
});
const handlers = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`) as { start(request: Request): Promise<Response>; callback(request: Request): Promise<Response> };
function reset() {
  fixture.jar.clear(); fixture.identity = undefined; fixture.identityFails = false;
  fixture.identityReads = 0; fixture.configured = true; fixture.writes.length = 0;
}
function location(response: Response) { assert.equal(response.status, 307); assert.equal(response.headers.get('cache-control'), 'no-store'); return new URL(response.headers.get('location')!); }
function adapterRequest(href: string) {
  const url = new URL(href, 'https://hskkit.test');
  // Model the pinned adapter's decoded query -> query string conversion.
  const query = [...url.searchParams].map(([key, value]) => `${key}=${value}`).join('&');
  return new Request(`${url.origin}${url.pathname}?${query}`);
}
function transientCookies(response: Response) {
  const cookies = response.headers.getSetCookie();
  for (const name of ['state', 'verifier', 'return']) {
    const cookie = cookies.find(value => value.startsWith(`hskkit_oauth_${name}=`));
    assert.ok(cookie); assert.match(cookie, /HttpOnly/i); assert.match(cookie, /Secure/i); assert.match(cookie, /SameSite=lax/i); assert.match(cookie, /Max-Age=600/i);
  }
}

test('anonymous start goes directly to Google with PKCE and private short-lived state, without forced account selection', async () => {
  reset();
  const response = await handlers.start(new Request(`https://hskkit.test${googleSignInHref('/today?level=3#task')}&timezone=Europe%2FLondon`));
  const url = location(response);
  assert.equal(url.origin, 'https://accounts.google.com');
  assert.equal(url.searchParams.get('scope'), 'openid email profile');
  assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
  assert.ok(url.searchParams.get('code_challenge')); assert.ok(url.searchParams.get('state'));
  assert.equal(url.searchParams.has('prompt'), false); assert.equal(fixture.identityReads, 0);
  transientCookies(response); assert.deepEqual(fixture.writes, []);
});

test('start and error retry preserve the complete destination through production adapter query reconstruction', async () => {
  reset();
  const target = '/reading/article/a-market-morning?view=pinyin&level=1#key-vocabulary';
  const request = adapterRequest(googleSignInHref(target));
  const response = await handlers.start(request);
  assert.equal(location(response).origin, 'https://accounts.google.com');
  const cookie = response.headers.getSetCookie().find(value => value.startsWith('hskkit_oauth_return='))!;
  assert.equal(decodeURIComponent(cookie.split(';')[0].slice('hskkit_oauth_return='.length)), target);
  fixture.configured = false;
  const retry = location(await handlers.start(request));
  assert.equal(signInReturnTo(new URL(adapterRequest(retry.href).url).searchParams.get('returnTo')), target);
});

test('active sessions return to the requested page; invalid sessions and identity read failure still require Google', async () => {
  for (const connection of ['google', 'sync_key', 'deleted', 'failure']) {
    reset(); fixture.jar.set('hskkit_session', 'existing-session');
    fixture.identity = { connection: connection === 'sync_key' ? 'sync_key' : 'google', account: { status: connection === 'deleted' ? 'deleted' : 'active' } };
    fixture.identityFails = connection === 'failure';
    const response = await handlers.start(new Request(`https://hskkit.test${googleSignInHref('/today?level=3#task')}`));
    const url = location(response);
    assert.equal(url.origin, connection === 'google' ? 'https://hskkit.test' : 'https://accounts.google.com');
    if (connection === 'google') { assert.equal(`${url.pathname}${url.search}${url.hash}`, '/today?level=3#task'); assert.equal(response.headers.has('set-cookie'), false); }
    assert.equal(fixture.identityReads, 1); assert.deepEqual(fixture.writes, []);
  }
});

test('explicit account switching bypasses session reuse and retains selection through configuration failure', async () => {
  reset(); fixture.jar.set('hskkit_session', 'existing-session');
  fixture.identity = { connection: 'google', account: { status: 'active' } };
  const request = new Request(`https://hskkit.test${googleSignInHref('/account', true)}`);
  const response = await handlers.start(request);
  assert.equal(location(response).searchParams.get('prompt'), 'select_account');
  assert.equal(fixture.identityReads, 0);
  assert.ok(response.headers.getSetCookie().some(cookie => /^hskkit_oauth_switch=1;/.test(cookie) && /Max-Age=600/.test(cookie) && /HttpOnly/.test(cookie)));
  fixture.configured = false;
  const retry = location(await handlers.start(request));
  assert.equal(retry.pathname, '/login'); assert.equal(retry.searchParams.get('error'), 'oauth_not_configured');
  assert.equal(retry.searchParams.get('selectAccount'), '1'); assert.deepEqual(fixture.writes, []);
});

test('invalid state, missing verifier and provider cancellation never exchange code or create an account', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw Error('Provider must not be called'); };
  try {
    for (const query of ['?code=test-code&state=wrong', '?code=test-code&state=expected', '?state=expected', '?error=access_denied']) {
      reset(); fixture.jar.set('hskkit_oauth_state', 'expected'); fixture.jar.set('hskkit_oauth_return', '/today#task'); fixture.jar.set('hskkit_oauth_switch', '1');
      if (query !== '?code=test-code&state=expected') fixture.jar.set('hskkit_oauth_verifier', 'test-verifier');
      const response = await handlers.callback(new Request(`https://hskkit.test/api/v1/auth/google/callback${query}`));
      const url = location(response);
      assert.equal(url.pathname, '/login'); assert.equal(signInReturnTo(url.searchParams.get('returnTo')), '/today#task'); assert.equal(url.searchParams.get('selectAccount'), '1');
      assert.equal(url.searchParams.get('error'), query.includes('error=') ? 'google_cancelled' : 'invalid_callback');
      assert.deepEqual(fixture.writes, []);
      assert.ok(response.headers.getSetCookie().some(cookie => cookie.startsWith('hskkit_oauth_switch=;')));
      assert.ok(!response.headers.getSetCookie().some(cookie => cookie.startsWith('hskkit_session=')));
    }
  } finally { globalThis.fetch = originalFetch; }
});

test('provider exchange failure preserves the destination and existing session without granting a new one', async () => {
  reset();
  for (const [name, value] of Object.entries({ state: 'expected', verifier: 'test-verifier', return: '/today?level=2#task' })) fixture.jar.set(`hskkit_oauth_${name}`, value);
  fixture.jar.set('hskkit_session', 'existing-session');
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response('', { status: 503 });
  try {
    const response = await handlers.callback(new Request('https://hskkit.test/api/v1/auth/google/callback?code=test-code&state=expected'));
    const url = location(response);
    assert.equal(url.pathname, '/login'); assert.equal(url.searchParams.get('error'), 'google_failed');
    assert.equal(signInReturnTo(url.searchParams.get('returnTo')), '/today?level=2#task');
    assert.deepEqual(fixture.writes, []);
    assert.ok(!response.headers.getSetCookie().some(cookie => cookie.startsWith('hskkit_session=')));
  } finally { globalThis.fetch = originalFetch; }
});

test('successful callbacks retain the original destination and session security, without merging guest data', async () => {
  const originalFetch = globalThis.fetch;
  const requests: string[] = [];
  globalThis.fetch = async (input, init) => {
    const url = String(input); requests.push(url);
    if (url === 'https://oauth2.googleapis.com/token') {
      assert.equal(new URLSearchParams(String(init?.body)).get('code_verifier'), 'test-verifier');
      return Response.json({ access_token: 'test-access-token' });
    }
    assert.equal(url, 'https://openidconnect.googleapis.com/v1/userinfo');
    assert.equal((init?.headers as Record<string, string>).authorization, 'Bearer test-access-token');
    return Response.json({ sub: 'test-subject', name: 'Test learner', email_verified: true });
  };
  try {
    for (const hasGuest of [false, true]) {
      reset(); requests.length = 0;
      for (const [name, value] of Object.entries({ state: 'expected', verifier: 'test-verifier', return: '/reading/article/a-market-morning?view=pinyin#vocabulary', switch: '1' })) fixture.jar.set(`hskkit_oauth_${name}`, value);
      if (hasGuest) fixture.jar.set('hskkit_guest', 'test-guest');
      const response = await handlers.callback(new Request('https://hskkit.test/api/v1/auth/google/callback?code=test-code&state=expected'));
      const url = location(response);
      assert.equal(url.pathname, '/reading/article/a-market-morning'); assert.equal(url.hash, '#vocabulary'); assert.equal(url.searchParams.get('view'), 'pinyin');
      assert.equal(url.searchParams.get('hskkit_signed_in'), hasGuest ? '1' : null);
      assert.deepEqual(fixture.writes, ['account', 'trial', 'session']);
      assert.equal(requests.length, 2);
      const session = response.headers.getSetCookie().find(cookie => cookie.startsWith('hskkit_session='))!;
      assert.match(session, /HttpOnly/); assert.match(session, /Secure/); assert.match(session, /SameSite=lax/i); assert.match(session, /Expires=/i);
      assert.ok(!response.headers.getSetCookie().some(cookie => cookie.startsWith('hskkit_guest=')));
      for (const name of ['state', 'verifier', 'return', 'switch']) assert.ok(response.headers.getSetCookie().some(cookie => cookie.startsWith(`hskkit_oauth_${name}=;`)));
    }
  } finally { globalThis.fetch = originalFetch; }
});
