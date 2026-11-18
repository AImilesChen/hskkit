import test from "node:test";
import assert from "node:assert/strict";
import {anonymousAccountResponse} from "../src/lib/runtime/anonymous-account.ts";
import { build } from "esbuild";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
test("Stateless account lookup preserves the existing anonymous response without caching it",async()=>{
 const r=anonymousAccountResponse(new Request('https://hskkit.com/api/v1/account'))!;
 assert.equal(r.status,200);assert.equal(r.headers.get('cache-control'),'private, no-store');
 assert.deepEqual(await r.json(),{account:null,connection:null,guest:{hasData:false,attempts:0,learningSessions:0,plannerVersions:0,revision:0}});
});

test('anonymous session response matches the unchanged real Next route and imports no account/database runtime', async () => {
 const root = fileURLToPath(new URL('../', import.meta.url));
 const require = createRequire(import.meta.url);
 const reference = await build({entryPoints:[root+'src/app/api/v1/account/session/route.ts'],bundle:true,write:false,platform:'node',format:'esm',plugins:[{name:'reference',setup(builder){
  builder.onResolve({filter:/^next\/server$/},()=>({path:pathToFileURL(require.resolve('next/server.js')).href,external:true}));
  builder.onResolve({filter:/^(next\/headers|@\/lib\/account\/identity|@\/lib\/d1\/user-protection)$/},args=>({path:args.path,namespace:'platform'}));
  builder.onLoad({filter:/.*/,namespace:'platform'},args=>({contents:args.path==='next/headers'?'export const cookies=async()=>({has:()=>false});':args.path.includes('/identity')?`export const SESSION_COOKIE='hskkit_session',ACCOUNT_COOKIE='hskkit_account';export const requestIdentity=()=>{throw Error('Anonymous must not read account');};`:`export const d1UnavailableResponse=()=>undefined;`,loader:'js'}));
 }}]});
 const route=await import('data:text/javascript;base64,'+Buffer.from(reference.outputFiles[0].text).toString('base64'));
 const r=anonymousAccountResponse(new Request('https://hskkit.test/api/v1/account/session?source=header'))!;
 const expected=await route.GET();
 assert.equal(r.status,expected.status);assert.deepEqual([...r.headers],[...expected.headers]);assert.equal(await r.text(),await expected.text());
 const bundled=await build({entryPoints:[root+'src/lib/runtime/anonymous-account.ts'],bundle:true,write:false,metafile:true,platform:'browser',format:'esm'});
 assert.ok(!Object.keys(bundled.metafile!.inputs).some(input=>/next\/dist\/server|account\/(identity|authentication|storage)|content\/|learning\//.test(input)));
 for(const cookie of ['hskkit_session=valid','hskkit_session=expired','hskkit_account=key','hskkit_guest=progress','consent=yes','malformed'])
  assert.equal(anonymousAccountResponse(new Request('https://hskkit.test/api/v1/account/session',{headers:{cookie}})),undefined);
 for(const method of ['HEAD','POST','PUT','DELETE','OPTIONS']) assert.equal(anonymousAccountResponse(new Request('https://hskkit.test/api/v1/account/session',{method})),undefined);
 for(const tail of ['/','/extra']) assert.equal(anonymousAccountResponse(new Request('https://hskkit.test/api/v1/account/session'+tail)),undefined);
 assert.equal(anonymousAccountResponse(new Request('https://hskkit.test/api/v1/account/session',{headers:{'user-agent':'MJ12bot/1.4'}})),undefined);
});
test("Every account, guest, arbitrary and malformed cookie goes through the original identity path",()=>{
 for(const cookie of ['hskkit_session=fixture','hskkit_account=fixture','hskkit_guest=fixture','consent=yes','malformed','%68skkit_session=fixture'])assert.equal(anonymousAccountResponse(new Request('https://hskkit.com/api/v1/account',{headers:{cookie}})),undefined);
});
test("No-cookie rewards keep the existing unauthenticated status before parsing bodies",async()=>{
 for(const method of ['GET','POST']){const r=anonymousAccountResponse(new Request('https://hskkit.com/api/v1/account/learning-rewards',{method,...(method==='POST'?{body:'invalid-json'}:{})}))!;assert.equal(r.status,401);assert.deepEqual(await r.json(),{error:'ACCOUNT_REQUIRED'});}
});
test("Login, paid files, state-changing account methods and blocked crawlers never use the fast path",()=>{
 for(const route of ['/api/v1/auth/google/start','/api/v1/course-tests/chinese-1/b/file/paper-data.json','/api/v1/account/','/api/v1/%61ccount'])assert.equal(anonymousAccountResponse(new Request('https://hskkit.com'+route)),undefined);
 for(const method of ['POST','PUT','DELETE','HEAD'])assert.equal(anonymousAccountResponse(new Request('https://hskkit.com/api/v1/account',{method})),undefined);
 assert.equal(anonymousAccountResponse(new Request('https://hskkit.com/api/v1/account',{headers:{'user-agent':'MJ12bot/1.4'}})),undefined);
});
