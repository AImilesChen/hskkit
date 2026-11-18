import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { getPublicGuideSummaries } from '../src/lib/blog/public-guide-summaries.ts';
import { guideSections } from '../src/lib/guides/catalog.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
// Reference uses the existing published-version repository function, not a
// second reimplementation of the old read path. SQLite executes the real SQL.
const bundled = await build({entryPoints:[root+'src/lib/blog/repository.ts'],bundle:true,write:false,platform:'node',format:'esm',plugins:[{name:'db-reference',setup(builder){
 builder.onResolve({filter:/^@opennextjs\/cloudflare$/},()=>({path:'context',namespace:'fixture'}));
 builder.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:'export const getCloudflareContext=()=>({env:{LEARNING_DB:globalThis.__guideDbReference}});',loader:'js'}));
}}]});
const repository = await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));
const slugs = guideSections.flatMap(section=>section.slugs);
const now = new Date('2026-11-18T12:00:00.000Z');

function fixture(t: {after(fn:()=>void):void}) {
 const sqlite = new DatabaseSync(':memory:');t.after(()=>sqlite.close());
 sqlite.exec(`CREATE TABLE blog_posts(id TEXT PRIMARY KEY,slug TEXT,status TEXT,published_at TEXT,updated_at TEXT,published_version_number INTEGER);
 CREATE TABLE blog_post_versions(post_id TEXT,version_number INTEGER,snapshot_json TEXT,PRIMARY KEY(post_id,version_number));`);
 const queries: string[]=[];
 let beforeRead: (()=>void)|undefined;
 const database = {prepare(sql:string) {return {bind(...bindings:unknown[]) {return {
  async all<T>() { queries.push(sql);const hook=beforeRead;beforeRead=undefined;hook?.();return {results:sqlite.prepare(sql).all(...bindings as string[]) as T[]}; },
  async first<T>() {return sqlite.prepare(sql).get(...bindings as string[]) as T|undefined;},
 };}};}};
 function version(slug:string,n:number,title='Published '+slug,excerpt='Public excerpt '+slug) {
  sqlite.prepare('INSERT INTO blog_post_versions VALUES(?,?,?)').run(slug,n,JSON.stringify({slug,title,excerpt,contentMarkdown:'ARTICLE BODY MUST NOT BE TRANSFERRED '.repeat(2000)}));
 }
 function post(slug:string,status='published',publishedAt='2026-01-01T00:00:00.000Z') {
  version(slug,1);
  sqlite.prepare('INSERT INTO blog_posts VALUES(?,?,?,?,?,?)').run(slug,slug,status,publishedAt,'2026-01-01T00:00:00.000Z',1);
 }
 return {sqlite,database,queries,version,post,onRead(fn:()=>void){beforeRead=fn;}};
}

test('all nine guide cards match the real repository; cold reads use two queries and warm reads use one small revision check',async t=>{
 const f=fixture(t);for(const slug of slugs)f.post(slug);
 (globalThis as unknown as {__guideDbReference:unknown}).__guideDbReference=f.database;
 const expected=await Promise.all(slugs.map(async slug=>{const p=await repository.getPublishedBlogPostBySlug(slug);return {lookupSlug:slug,slug:p.slug,title:p.title,excerpt:p.excerpt};}));
 const first=await getPublicGuideSummaries(f.database,slugs,now);
 assert.deepEqual(first,expected.sort((a,b)=>a.slug.localeCompare(b.slug)));
 assert.equal(f.queries.length,2);
 assert.ok(f.queries.every(sql=>!sql.includes('contentMarkdown')&&!sql.includes('v.snapshot_json FROM')));
 assert.ok(f.queries[1].includes("json_extract(v.snapshot_json,'$.excerpt')"));
 f.queries.length=0;
 first[0].title='Caller mutation';
 assert.deepEqual(await getPublicGuideSummaries(f.database,[...slugs].reverse(),now),expected);
 assert.equal(f.queries.length,1);assert.ok(!f.queries[0].includes('snapshot_json'));
});

test('publication changes, withdrawal and unpublished edits retain existing visibility without a stale TTL',async t=>{
 const f=fixture(t),slug=slugs[0];f.post(slug);
 const read=()=>getPublicGuideSummaries(f.database,[slug],now);
 assert.equal((await read())[0].title,'Published '+slug);
 f.version(slug,2,'Draft change');
 f.sqlite.prepare('UPDATE blog_posts SET updated_at=? WHERE slug=?').run('2026-11-18T11:00:00.000Z',slug);
 assert.equal((await read())[0].title,'Published '+slug,'unpublished revision stays private');
 f.sqlite.prepare('UPDATE blog_posts SET published_version_number=2 WHERE slug=?').run(slug);
 assert.equal((await read())[0].title,'Draft change','publish appears on next read');
 f.sqlite.prepare("UPDATE blog_posts SET status='withdrawn' WHERE slug=?").run(slug);
 assert.deepEqual(await read(),[]);
 f.sqlite.prepare("UPDATE blog_posts SET status='draft' WHERE slug=?").run(slug);
 assert.deepEqual(await read(),[]);
});

test('scheduled publication appears at the exact eligibility boundary; missing published snapshots and unknown slugs stay absent',async t=>{
 const f=fixture(t),slug=slugs[1];f.post(slug,'published','2026-11-18T12:00:01.000Z');
 f.post(slugs[2]);f.sqlite.prepare('DELETE FROM blog_post_versions WHERE post_id=?').run(slugs[2]);
 const requested=[slug,slugs[2],'unknown'];
 assert.deepEqual(await getPublicGuideSummaries(f.database,requested,now),[]);
 const posts=await getPublicGuideSummaries(f.database,requested,new Date(now.getTime()+1000));
 assert.deepEqual(posts.map(post=>post.slug),[slug]);
});

test('a publication racing the metadata query cannot poison the next cached result',async t=>{
 const f=fixture(t),slug=slugs[0];f.post(slug);
 f.version(slug,2,'New public title');
 const original=f.database.prepare;
 let queries=0;
 f.database.prepare=sql=>{if(++queries===2)f.sqlite.prepare('UPDATE blog_posts SET published_version_number=2 WHERE slug=?').run(slug);return original(sql);};
 assert.equal((await getPublicGuideSummaries(f.database,[slug],now))[0].title,'New public title');
 f.queries.length=0;
 assert.equal((await getPublicGuideSummaries(f.database,[slug],now))[0].title,'New public title');
 assert.equal(f.queries.length,1);
});

test('database failures do not serve an unverified stale snapshot; bindings cannot share their cache',async t=>{
 const a=fixture(t),b=fixture(t),slug=slugs[0];a.post(slug);b.post(slug);
 b.sqlite.prepare("UPDATE blog_post_versions SET snapshot_json=json_set(snapshot_json,'$.title','Other binding')").run();
 await getPublicGuideSummaries(a.database,[slug],now);
 assert.equal((await getPublicGuideSummaries(b.database,[slug],now))[0].title,'Other binding');
 a.onRead(()=>{throw Error('D1_UNAVAILABLE');});
 await assert.rejects(getPublicGuideSummaries(a.database,[slug],now),/D1_UNAVAILABLE/);
 assert.deepEqual(await getPublicGuideSummaries(a.database,[],now),[]);
 await assert.rejects(getPublicGuideSummaries(a.database,Array.from({length:33},(_,i)=>String(i)),now),/budget/);
});

test('legacy snapshot slugs keep their published link while staying in the requested guide slot',async t=>{
 const f=fixture(t),slug=slugs[0];f.post(slug);
 f.sqlite.prepare("UPDATE blog_post_versions SET snapshot_json=json_set(snapshot_json,'$.slug','legacy-published-link')").run();
 const post=(await getPublicGuideSummaries(f.database,[slug],now))[0];
 assert.equal(post.lookupSlug,slug);assert.equal(post.slug,'legacy-published-link');
});
