import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';
import { build } from 'esbuild';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const fixture = { jar: new Map<string, string>(), database: undefined as DatabaseSync | undefined, queries: [] as string[], failReads: false, failWrites: false };
(globalThis as any).__hskAuthenticationFixture = fixture;
const database = { prepare(sql: string) {
  fixture.queries.push(sql);
  let values: any[] = [];
  const statement = {
    bind(...args: any[]) { values = args; return statement; },
    async first() { if (fixture.failReads) throw new Error('fixture database unavailable'); return fixture.database!.prepare(sql).get(...values) ?? null; },
    async run() { if (fixture.failWrites) throw new Error('fixture recency write failed'); return fixture.database!.prepare(sql).run(...values); },
  };
  return statement;
} };
(globalThis as any).__hskAuthenticationDatabase = database;

const result = await build({
  stdin: { contents: `export * from './src/lib/account/authentication.ts'; export {requestIdentity} from './src/lib/account/identity.ts'; export {GET as start} from './src/app/api/v1/auth/google/start/route.ts'; export {resetUserD1ProtectionForTest} from './src/lib/d1/user-retry.ts';`, resolveDir: root, loader: 'ts' },
  bundle: true, write: false, metafile: true, platform: 'node', format: 'esm', packages: 'external',
  plugins: [{ name: 'platform-only-fixture', setup(builder) {
    builder.onResolve({ filter: /^next\/server$/ }, () => ({ path: pathToFileURL(require.resolve('next/server.js')).href, external: true }));
    builder.onResolve({ filter: /^(next\/headers|@opennextjs\/cloudflare)$/ }, args => ({ path: args.path, namespace: 'fixture' }));
    builder.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ contents: args.path === 'next/headers'
      ? `export const cookies=async()=>({get:name=>{const value=globalThis.__hskAuthenticationFixture.jar.get(name);return value===undefined?undefined:{value};}});`
      : `export const getCloudflareContext=()=>({env:{LEARNING_DB:globalThis.__hskAuthenticationDatabase,GOOGLE_CLIENT_ID:'fixture-client',GOOGLE_CLIENT_SECRET:'fixture-secret',GOOGLE_REDIRECT_URI:'https://hskkit.test/api/v1/auth/google/callback'}});`, loader: 'js' }));
    builder.onResolve({ filter: /^react$/ }, () => ({ path: pathToFileURL(require.resolve('react')).href, external: true }));
  } }],
});
const auth = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
const token = (kind: string) => `fixture-${kind}-token-long-enough`;
const hash = (value: string) => createHash('sha256').update(value).digest('base64url');
function reset() {
  fixture.database?.close(); fixture.database = new DatabaseSync(':memory:'); fixture.jar.clear(); fixture.queries.length = 0; fixture.failReads = false; fixture.failWrites = false; auth.resetUserD1ProtectionForTest();
  fixture.database.exec(`CREATE TABLE accounts(user_id TEXT PRIMARY KEY,display_name TEXT,timezone TEXT,status TEXT,created_at TEXT,updated_at TEXT,deleted_at TEXT);
    CREATE TABLE account_sessions(token_hash TEXT PRIMARY KEY,user_id TEXT,revoked_at TEXT,expires_at TEXT,last_used_at TEXT);
    CREATE TABLE account_tokens(token_hash TEXT PRIMARY KEY,user_id TEXT,revoked_at TEXT,last_used_at TEXT);
    INSERT INTO accounts VALUES('active','Fixture learner','Europe/London','active','2026-01-01','2026-01-02',NULL),('deleted','Deleted learner','UTC','deleted','2026-01-01','2026-01-02','2026-01-03');`);
  for (const kind of ['valid','expired','revoked','deleted']) fixture.database.prepare('INSERT INTO account_sessions VALUES(?,?,?,?,?)').run(hash(token(kind)),kind === 'deleted' ? 'deleted' : 'active',kind === 'revoked' ? '2026-01-03' : null,kind === 'expired' ? '2000-01-01' : '2999-01-01','2000-01-01');
  for (const kind of ['valid','revoked','deleted']) fixture.database.prepare('INSERT INTO account_tokens VALUES(?,?,?,?)').run(hash(token(kind)),kind === 'deleted' ? 'deleted' : 'active',kind === 'revoked' ? '2026-01-03' : null,'2000-01-01');
}

test('login and real identity dependencies exclude learning, placement and question-bank initialization', () => {
  const inputs = Object.keys(result.metafile!.inputs).filter(path => path.startsWith('src/'));
  assert.ok(inputs.some(path => path.endsWith('/authentication.ts')));
  assert.deepEqual(inputs.filter(path => /\/(learning|practice|placement|planner|tones)\//.test(path)), []);
  assert.ok(result.outputFiles[0].contents.length < 40_000, 'login application dependency bundle must remain small');
});

test('malformed session and recovery credentials perform no database reads', async () => {
  reset();
  for (const value of [undefined,'','short','x'.repeat(101)]) {
    assert.equal(await auth.authenticateSession(value), undefined);
    assert.equal(await auth.authenticateAccount(value), undefined);
  }
  assert.deepEqual(fixture.queries, []);
});

test('real authentication SQL preserves active accounts and rejects expired, revoked and deleted sessions', async () => {
  reset();
  assert.deepEqual(await auth.authenticateSession(token('valid')), {userId:'active',displayName:'Fixture learner',timezone:'Europe/London',status:'active',createdAt:'2026-01-01',updatedAt:'2026-01-02',deletedAt:undefined});
  for (const kind of ['expired','revoked','deleted','unknown']) assert.equal(await auth.authenticateSession(token(kind)), undefined, kind);
  assert.equal(fixture.queries.filter(sql => sql.startsWith('UPDATE')).length, 0);
});

test('real recovery-key SQL preserves validity and revocation checks', async () => {
  reset();
  assert.equal((await auth.authenticateAccount(token('valid')))?.userId, 'active');
  for (const kind of ['revoked','deleted','unknown']) assert.equal(await auth.authenticateAccount(token(kind)), undefined, kind);
});

test('optional activity writes retain their fifteen-minute throttle and write failures do not log users out', async () => {
  reset();
  for (const [table, authenticate] of [['account_sessions', auth.authenticateSession], ['account_tokens', auth.authenticateAccount]] as const) {
    await authenticate(token('valid'));
    assert.equal(fixture.database!.prepare(`SELECT last_used_at FROM ${table} WHERE token_hash=?`).get(hash(token('valid')))!.last_used_at, '2000-01-01');
    await authenticate(token('valid'), true);
    const touched = fixture.database!.prepare(`SELECT last_used_at FROM ${table} WHERE token_hash=?`).get(hash(token('valid')))!.last_used_at;
    assert.notEqual(touched, '2000-01-01');
    await authenticate(token('valid'), true);
    assert.equal(fixture.database!.prepare(`SELECT last_used_at FROM ${table} WHERE token_hash=?`).get(hash(token('valid')))!.last_used_at, touched);
    fixture.failWrites = true;
    assert.equal((await authenticate(token('valid'), true))?.userId, 'active');
    fixture.failWrites = false;
  }
  fixture.failReads = true;
  await assert.rejects(() => auth.authenticateSession(token('valid')), /database unavailable/);
});

test('real identity preserves Google priority, recovery-key fallback and guest identity', async () => {
  reset(); fixture.jar.set('hskkit_session', token('valid')); fixture.jar.set('hskkit_account', token('valid')); fixture.jar.set('hskkit_guest', 'fixture-guest');
  let identity = await auth.requestIdentity();
  assert.equal(identity.connection, 'google'); assert.equal(identity.guestId, 'fixture-guest'); assert.equal(identity.syncKey, undefined);
  fixture.jar.set('hskkit_session', token('expired'));
  identity = await auth.requestIdentity({touchSession:true});
  assert.equal(identity.connection, 'sync_key'); assert.equal(identity.syncKey, token('valid')); assert.equal(identity.guestId, 'fixture-guest');
});

test('real login route reuses only valid Google sessions and keeps PKCE and private Cookies for other visits', async () => {
  reset(); fixture.jar.set('hskkit_session', token('valid'));
  let response = await auth.start(new Request('https://hskkit.test/api/v1/auth/google/start?returnTo=%2Ftoday'));
  assert.equal(response.status,307); assert.equal(response.headers.get('location'),'https://hskkit.test/today'); assert.equal(response.headers.has('set-cookie'),false);
  assert.equal(fixture.queries.filter(sql=>sql.startsWith('UPDATE')).length,0);
  for (const kind of ['anonymous','expired','switch']) {
    fixture.jar.clear(); fixture.queries.length=0;
    if(kind!=='anonymous')fixture.jar.set('hskkit_session',token(kind==='switch'?'valid':'expired'));
    response=await auth.start(new Request(`https://hskkit.test/api/v1/auth/google/start?returnTo=%2Ftoday${kind==='switch'?'&selectAccount=1':''}`));
    const location=new URL(response.headers.get('location')!);
    assert.equal(location.origin,'https://accounts.google.com'); assert.equal(location.searchParams.get('code_challenge_method'),'S256'); assert.equal(response.headers.get('cache-control'),'no-store');
    const cookies=response.headers.getSetCookie(); const verifier=cookies.find(value=>value.startsWith('hskkit_oauth_verifier='))!;
    assert.match(verifier,/HttpOnly/); assert.match(verifier,/Secure/); assert.match(verifier,/SameSite=lax/); assert.match(verifier,/Max-Age=600/);
    const value=decodeURIComponent(verifier.split(';')[0].slice('hskkit_oauth_verifier='.length));
    assert.equal(location.searchParams.get('code_challenge'),hash(value));
    if(kind==='switch'){assert.equal(location.searchParams.get('prompt'),'select_account');assert.equal(fixture.queries.length,0);}
    assert.equal(fixture.queries.filter(sql=>sql.startsWith('UPDATE')||sql.startsWith('INSERT')).length,0);
  }
});
