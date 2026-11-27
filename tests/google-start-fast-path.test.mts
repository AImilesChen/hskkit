import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readFile, mkdtemp, mkdir, writeFile, copyFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import { build } from 'esbuild';
import { anonymousGoogleStartResponse } from '../src/lib/runtime/google-start.ts';
import { googleSignInHref } from '../src/lib/account/sign-in.ts';
import { pkceChallenge } from '../src/lib/account/oauth-parameters.ts';

const env = { GOOGLE_CLIENT_ID: 'fixture-client', GOOGLE_CLIENT_SECRET: 'fixture-secret', GOOGLE_REDIRECT_URI: 'https://hskkit.test/api/v1/auth/google/callback' };
const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
// Execute the unchanged Next route as the behavioral reference. Only the
// platform's cookie/context access is replaced; real NextResponse is retained.
const referenceBuild = await build({
  entryPoints: [root + 'src/app/api/v1/auth/google/start/route.ts'],
  bundle: true, write: false, platform: 'node', format: 'esm', target: 'node22',
  plugins: [{ name: 'platform-reference', setup(builder) {
    builder.onResolve({ filter: /^next\/server$/ }, () => ({ path: pathToFileURL(require.resolve('next/server.js')).href, external: true }));
    builder.onResolve({ filter: /^(next\/headers|@opennextjs\/cloudflare|@\/lib\/account\/identity)$/ }, args => ({ path: args.path, namespace: 'reference' }));
    builder.onLoad({ filter: /.*/, namespace: 'reference' }, args => ({ contents:
      args.path === 'next/headers' ? 'export const cookies=async()=>({get:()=>undefined});' :
      args.path === '@opennextjs/cloudflare' ? `export const getCloudflareContext=()=>({env:${JSON.stringify(env)}});` :
      `export const SESSION_COOKIE='hskkit_session', OAUTH_STATE_COOKIE='hskkit_oauth_state', OAUTH_VERIFIER_COOKIE='hskkit_oauth_verifier', OAUTH_RETURN_COOKIE='hskkit_oauth_return', OAUTH_SWITCH_COOKIE='hskkit_oauth_switch'; export const requestIdentity=async()=>{throw Error('Anonymous start must not read account state');};`, loader: 'js' }));
  } }],
});
const reference = await import('data:text/javascript;base64,' + Buffer.from(referenceBuild.outputFiles[0].text).toString('base64')) as {GET(request: Request): Promise<Response>};

function readCookies(response: Response) {
  return new Map(response.headers.getSetCookie().map(raw => {
    const parts = raw.split(';').map(value => value.trim());
    const split = parts[0].indexOf('=');
    return [parts[0].slice(0, split), { value: decodeURIComponent(parts[0].slice(split + 1)), attributes: parts.slice(1) }];
  }));
}

async function comparable(response: Response) {
  assert.equal(response.status, 307);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(await response.text(), '');
  const url = new URL(response.headers.get('location')!);
  const cookies = readCookies(response);
  const state = cookies.get('hskkit_oauth_state')!;
  const verifier = cookies.get('hskkit_oauth_verifier')!;
  assert.match(state.value, /^[A-Za-z0-9_-]{43}$/);
  assert.match(verifier.value, /^[A-Za-z0-9_-]{64}$/);
  assert.equal(url.searchParams.get('state'), state.value);
  assert.equal(url.searchParams.get('code_challenge'), await pkceChallenge(verifier.value));
  url.searchParams.delete('state'); url.searchParams.delete('code_challenge');
  const now = Date.now();
  for (const [name, cookie] of cookies) {
    const expiry = cookie.attributes.find(value => value.startsWith('Expires='));
    const age = cookie.attributes.find(value => value.startsWith('Max-Age='));
    if (age) assert.ok(Math.abs(Date.parse(expiry!.slice(8)) - (now + Number(age.slice(8)) * 1000)) < 2500, name);
    cookie.attributes = cookie.attributes.filter(value => !value.startsWith('Expires=') || name === 'hskkit_oauth_switch');
    if (['hskkit_oauth_state', 'hskkit_oauth_verifier', 'hskkit_ref_device'].includes(name)) cookie.value = '<fresh random value>';
  }
  return { location: url.href, cookies: [...cookies] };
}

test('anonymous Worker redirects match the unchanged Next route, including return addresses and cookie security', async () => {
  const targets = ['/account', '/today?level=3#task', '/reading/article/a-market-morning?view=pinyin&level=1#vocabulary', '/dictionary?q=学习&mode=words#results', 'https://other.example', '/login', '/api/v1/auth/google/callback'];
  const queries = ['', '?selectAccount=1', '?ref=abcd1234', '?timezone=Europe%2FLondon', '?timezone=Invalid%2FZone', '?timezone=&ref=x', '?returnTo=v1._w'];
  for (const target of targets) for (const selectAccount of [false, true]) {
    queries.push(googleSignInHref(target, selectAccount).replace('/api/v1/auth/google/start', '') + '&ref=abcd1234&timezone=Asia%2FShanghai');
  }
  for (const query of queries) {
    const request = new Request('https://hskkit.test/api/v1/auth/google/start' + query);
    const fast = await anonymousGoogleStartResponse(request, env);
    assert.ok(fast, query);
    assert.deepEqual(await comparable(fast), await comparable(await reference.GET(request)), query);
  }
});

test('every request receives fresh independent state, verifier and referral-device cookies', async () => {
  const request = new Request('https://hskkit.test' + googleSignInHref('/today#task'));
  const first = readCookies((await anonymousGoogleStartResponse(request, env))!);
  const second = readCookies((await anonymousGoogleStartResponse(request, env))!);
  for (const name of ['hskkit_oauth_state', 'hskkit_oauth_verifier', 'hskkit_ref_device']) assert.notEqual(first.get(name)!.value, second.get(name)!.value, name);
});

test('all cookie-bearing requests retain original session reuse, account switching and device handling', async () => {
  for (const cookie of ['hskkit_session=valid', 'hskkit_session=expired', 'hskkit_account=sync-key', 'hskkit_guest=progress', 'consent=yes', 'hskkit_ref_device=existing-device', 'malformed', 'hskkit_session=']) {
    for (const selectAccount of [false, true]) assert.equal(await anonymousGoogleStartResponse(new Request('https://hskkit.test' + googleSignInHref('/today', selectAccount), { headers: { cookie } }), env), undefined, cookie);
  }
});

test('special methods, flight requests, crawlers and unrelated paths retain the existing middleware/Next path', async () => {
  const url = 'https://hskkit.test/api/v1/auth/google/start';
  for (const method of ['HEAD', 'POST', 'PUT', 'OPTIONS', 'DELETE']) assert.equal(await anonymousGoogleStartResponse(new Request(url, {method}), env), undefined);
  for (const key of ['rsc', 'next-action', 'next-router-prefetch', 'next-router-segment-prefetch', 'x-prerender-revalidate']) assert.equal(await anonymousGoogleStartResponse(new Request(url, {headers:{[key]:'1'}}), env), undefined);
  assert.equal(await anonymousGoogleStartResponse(new Request(url, {headers:{'user-agent':'MJ12bot/1.4'}}), env), undefined);
  for (const path of ['/today', '/api/v1/auth/google/callback', '/api/v1/auth/google/start/', '/api/v1/auth/%67oogle/start', '/formal-media/paper.json']) assert.equal(await anonymousGoogleStartResponse(new Request('https://hskkit.test'+path), env), undefined, path);
});

test('ambiguous and legacy query transport keeps the original adapter rather than changing login destinations', async () => {
  for (const query of ['returnTo=/today?level=2', 'returnTo=v1.L3RvZGF5&returnTo=v1.L2FjY291bnQ', 'timezone=Etc%2FGMT%2B8', 'timezone=UTC%26selectAccount%3D1', 'ref=abcd1234%23fragment', 'unknown=value', '_rsc=1', 'selectAccount=1%26ref%3Dabcd1234']) {
    assert.equal(await anonymousGoogleStartResponse(new Request('https://hskkit.test/api/v1/auth/google/start?'+query), env), undefined, query);
  }
});

test('configuration failures fall through to the original retry/error route', async () => {
  const request = new Request('https://hskkit.test/api/v1/auth/google/start');
  for (const overrides of [{GOOGLE_CLIENT_ID:''},{GOOGLE_CLIENT_SECRET:''},{GOOGLE_REDIRECT_URI:'http://outside.example/callback'}]) assert.equal(await anonymousGoogleStartResponse(request, {...env,...overrides}), undefined);
});

test('the Worker bundle excludes Next server, platform context and account/content initialization', async () => {
  const bundled = await build({entryPoints:[root+'src/lib/runtime/google-start.ts'],bundle:true,write:false,metafile:true,platform:'browser',format:'esm',target:'es2022'});
  const inputs=Object.keys(bundled.metafile!.inputs);
  assert.ok(!inputs.some(path=>/next\/dist\/server|@opennextjs|account\/(?:identity|authentication|storage)|learning\/|practice\/|content\/catalog/.test(path)),inputs.join('\n'));
  assert.ok(bundled.outputFiles[0].contents.length < 40_000);
  const patch=await readFile(root+'scripts/patch-open-next-email.mjs','utf8');
  assert.ok(patch.includes('if (googleStart) return googleStart;'));
});

test('the real build patch bypasses Next initialization after middleware and preserves every fallback', async () => {
  const fixture = await mkdtemp(path.join(root, '.google-start-test-'));
  assert.ok(path.resolve(fixture).startsWith(path.resolve(root) + path.sep));
  try {
  const openNext = path.join(fixture, '.open-next');
  await mkdir(path.join(fixture, 'scripts'), { recursive: true });
  await mkdir(path.join(fixture, '.next/server/app'), { recursive: true });
  await mkdir(path.join(openNext, 'server-functions/default'), { recursive: true });
  const template = await readFile(root+'node_modules/@opennextjs/cloudflare/dist/cli/templates/worker.js', 'utf8');
  await writeFile(path.join(openNext, 'worker.js'), template);
  await writeFile(path.join(fixture, '.next/server/app/_not-found.html'), '<!doctype html><title>Study item not found</title>');
  await writeFile(path.join(openNext, 'server-functions/default/handler.mjs'), 'getMiddlewareManifest(){return this.minimalMode?null:require(this.middlewareManifestPath)}');
  const patch = path.join(fixture, 'scripts/patch-open-next-email.mjs');
  await copyFile(root+'scripts/patch-open-next-email.mjs', patch);
  execFileSync(process.execPath, [patch], { timeout: 15_000 });
  const once = await readFile(path.join(openNext, 'worker.js'), 'utf8');
  execFileSync(process.execPath, [patch], { timeout: 15_000 });
  assert.equal(await readFile(path.join(openNext, 'worker.js'), 'utf8'), once, 'build patch must be idempotent');
  const count = { initialized: 0, calls: 0 };
  (globalThis as typeof globalThis & {__hskNextFallbackProbe: typeof count}).__hskNextFallbackProbe = count;
  const runtime = await build({
    entryPoints:[path.join(openNext,'worker.js')],bundle:true,write:false,platform:'browser',format:'esm',target:'es2022',
    plugins:[{name:'worker-platform-fixture',setup(builder){
      builder.onResolve({filter:/src\/lib\/runtime\//},args=>({path:path.join(root,'src/lib/runtime',path.basename(args.path))}));
      builder.onResolve({filter:/src\/lib\/admin\/analytics-runtime\.ts$/},()=>({path:path.join(root,'src/lib/admin/analytics-runtime.ts')}));
      builder.onResolve({filter:/^(cloudflare:(email|workers)|\.\/cloudflare\/|\.\/middleware\/|\.\/\.build\/|\.\/server-functions\/)/},args=>({path:args.path,namespace:'platform'}));
      builder.onLoad({filter:/.*/,namespace:'platform'},args=>({loader:'js',contents:
        args.path==='cloudflare:email' ? 'export class EmailMessage {}' :
        args.path==='cloudflare:workers' ? 'export class WorkerEntrypoint {}' :
        args.path.includes('/cloudflare/init') ? 'export const runWithCloudflareRequestContext=(r,e,c,run)=>run();' :
        args.path.includes('/cloudflare/images') ? 'export const handleCdnCgiImageRequest=()=>new Response("image");export const handleImageRequest=()=>new Response("image");' :
        args.path.includes('/cloudflare/skew-protection') ? 'export const maybeGetSkewProtectionResponse=()=>undefined;' :
        args.path.includes('/middleware/') ? 'export const handler=async r=>r.headers.get("user-agent")==="MJ12bot/1.4"?new Response("denied",{status:403}):new URL(r.url).pathname==="/word/xue-xi"?new Response("unchanged public cache"):r;' :
        args.path.includes('/server-functions/') ? 'globalThis.__hskNextFallbackProbe.initialized++;export const handler=async()=>{globalThis.__hskNextFallbackProbe.calls++;return new Response("original Next route");};' :
        'export class DOQueueHandler{};export class DOShardedTagCache{};export class BucketCachePurge{};'
      }));
    }}],
  });
  const worker = (await import('data:text/javascript;base64,'+Buffer.from(runtime.outputFiles[0].text).toString('base64'))).default as {fetch(r:Request,e:typeof env,c:object):Promise<Response>};
  const request = (tail='',headers={})=>new Request('https://hskkit.test'+googleSignInHref('/today#task')+tail,{headers});
  assert.equal((await worker.fetch(request(),env,{})).status,307);
  assert.deepEqual(count,{initialized:0,calls:0},'no Next initialization for ordinary anonymous login');
  const session = await worker.fetch(new Request('https://hskkit.test/api/v1/account/session'),env,{});
  assert.deepEqual(await session.json(),{account:null});
  assert.equal(session.headers.get('cache-control'),'private, no-store');
  assert.deepEqual(count,{initialized:0,calls:0},'anonymous session also avoids Next initialization');
  assert.equal((await worker.fetch(request('',{'user-agent':'MJ12bot/1.4'}),env,{})).status,403);
  assert.equal(await (await worker.fetch(new Request('https://hskkit.test/word/xue-xi'),env,{})).text(),'unchanged public cache');
  assert.deepEqual(count,{initialized:0,calls:0});
  for(const r of [request('',{cookie:'hskkit_session=existing'}),request('&unknown=value'),new Request('https://hskkit.test/today'),new Request('https://hskkit.test/api/v1/account/session',{headers:{cookie:'hskkit_session=existing'}})]) {
    assert.equal(await (await worker.fetch(r,env,{})).text(),'original Next route');
  }
  assert.deepEqual(count,{initialized:1,calls:4});
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});
