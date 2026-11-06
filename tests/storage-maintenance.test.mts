import test from "node:test";
import assert from "node:assert/strict";
import {CACHE_PREFIX, RELEASE_PREFIX, GRACE_MS, releaseKey, retentionPlan, maintainPageCache, legacyCutover, maintainLegacyCache} from "../src/lib/storage/cache-retention.ts";
import {cleanupExpiredExportObjects} from "../src/lib/storage/export-cleanup.ts";

const now = Date.parse("2026-11-15T12:00:00Z");
const build = (n: number) => String(n).padStart(21, "a");
const record = (n: number, days: number) => ({build: build(n), version: `00000000-0000-0000-0000-${String(n).padStart(12,"0")}`, deployedAt: now-days*86_400_000});
function store(records = [record(1,0),record(2,1),record(3,2),record(4,10),record(5,20)]) {
  const objects = new Map<string, {key:string;size:number;uploaded:Date}>();
  const deleted: string[][] = [];
  const data = new Map<string,string>();
  for (const r of records) objects.set(releaseKey(r), {key:releaseKey(r),size:1,uploaded:new Date(r.deployedAt)});
  const cacheKey = (n: number, index = 0) => `${CACHE_PREFIX}${build(n)}/${String(index).padStart(64,"a")}.cache`;
  const putCache = (n: number,index=0,uploaded=now-10*86_400_000) => {const key=cacheKey(n,index); objects.set(key,{key,size:100,uploaded:new Date(uploaded)}); return key;};
  return {objects,deleted,cacheKey,putCache,
    async list({prefix,limit,cursor}:{prefix:string;limit:number;cursor?:string}) {assert.equal(cursor,undefined); const all=[...objects.values()].filter(o=>o.key.startsWith(prefix)).sort((a,b)=>a.key.localeCompare(b.key)); return {objects:all.slice(0,limit),truncated:all.length>limit,cursor:all.length>limit?"more":undefined};},
    async delete(keys:string[]) {deleted.push(keys); for(const key of keys) objects.delete(key);},
    async get(key:string) {const body=data.get(key);return body?{async json(){return JSON.parse(body);}}:null;},
    async put(key:string,body:string) {data.set(key,body);},
  };
}

test("keeps current and two rollback builds and measures grace from retirement",()=>{
  const plan=retentionPlan([record(1,0),record(2,1),record(3,2),record(4,10),record(5,20)],build(1),now);
  assert.deepEqual([...plan.protectedBuilds],[build(1),build(2),build(3)]);
  // Build 4 stopped serving only two days ago, despite being deployed ten days ago.
  assert.deepEqual(plan.retired.map(r=>r.build),[build(5)]);
});
test("manual rollback and unrecorded production build freeze deletion",async()=>{
  const s=store();s.putCache(5);
  for(const active of [build(2),build(99)])await assert.rejects(maintainPageCache(s,{mode:"apply",now,readActiveBuild:async()=>active}),/REGISTRY_OUT_OF_SYNC/);
  assert.equal(s.deleted.length,0);
});
test("dry run has no delete even with retired objects",async()=>{
  const s=store();s.putCache(5);
  const result=await maintainPageCache(s,{mode:"dry-run",now,readActiveBuild:async()=>build(1)});
  assert.equal(result.inspectedObjects,1);assert.equal(result.deletedObjects,0);assert.equal(s.deleted.length,0);
});
test("bounded deletion resumes and never includes retained cache or formal resources",async()=>{
  const s=store();for(let i=0;i<550;i++)s.putCache(5,i);const protectedKey=s.putCache(1);
  const result=await maintainPageCache(s,{mode:"apply",now,readActiveBuild:async()=>build(1)});
  assert.equal(result.deletedObjects,500);assert.equal(s.objects.has(protectedKey),true);
  assert.equal([...s.objects.keys()].filter(k=>k.startsWith(CACHE_PREFIX+build(5))).length,50);
  const next=await maintainPageCache(s,{mode:"apply",now,readActiveBuild:async()=>build(1)});
  assert.equal(next.deletedObjects,50);assert.ok(s.deleted.flat().every(k=>k.startsWith(CACHE_PREFIX)));
});
test("empty retired markers are retired so they cannot starve later cache builds",async()=>{
  const s=store();await maintainPageCache(s,{mode:"apply",now,readActiveBuild:async()=>build(1)});
  assert.equal(s.objects.has(releaseKey(record(5,20))),false);
  assert.ok(s.deleted.flat().every(k=>k.startsWith(RELEASE_PREFIX)));
});
test("recent writes, foreign keys and production change all stop deletion",async()=>{
  const recent=store();recent.putCache(5,0,now-GRACE_MS+1);
  await assert.rejects(maintainPageCache(recent,{mode:"apply",now,readActiveBuild:async()=>build(1)}),/STILL_RECENT/);
  const changed=store();changed.putCache(5);let calls=0;
  await assert.rejects(maintainPageCache(changed,{mode:"apply",now,readActiveBuild:async()=>build(++calls===1?1:2)}),/PRODUCTION_CHANGED/);
  const foreign=store();foreign.objects.set(`${CACHE_PREFIX}${build(5)}/product.zip`,{key:`${CACHE_PREFIX}${build(5)}/product.zip`,size:1,uploaded:new Date(0)});
  await assert.rejects(maintainPageCache(foreign,{mode:"apply",now,readActiveBuild:async()=>build(1)}),/SCOPE_MISMATCH/);
  assert.equal(recent.deleted.length+changed.deleted.length+foreign.deleted.length,0);
});

test("legacy cache waits for three new builds and a separate 72-hour rollback grace",async()=>{
  const s=store();s.putCache(5);
  assert.equal(await legacyCutover(s,2,now),null);
  assert.equal(await legacyCutover(s,3,now),now);
  assert.equal(await legacyCutover(s,4,now+1000),now);
  const options={cutoverAt:now,registeredBuilds:3,activeBuild:build(1),maxDeletes:500,readActiveBuild:async()=>build(1)};
  assert.equal((await maintainLegacyCache(s,{...options,now:now+GRACE_MS-1})).deletedObjects,0);
  assert.equal(s.deleted.length,0);
  assert.equal((await maintainLegacyCache(s,{...options,now:now+GRACE_MS})).deletedObjects,1);
  assert.ok(s.deleted.flat().every(k=>k.startsWith(CACHE_PREFIX)));
});
test("legacy cleanup rejects active-build cache and foreign objects",async()=>{
  const s=store();s.putCache(1);
  await assert.rejects(maintainLegacyCache(s,{cutoverAt:now-GRACE_MS,registeredBuilds:3,activeBuild:build(1),now,maxDeletes:500,readActiveBuild:async()=>build(1)}),/LEGACY_CACHE_SCOPE_MISMATCH/);
  assert.equal(s.deleted.length,0);
});

test("expired export cleanup validates fresh state, ownership and path; failures remain retryable",async()=>{
  const jobs=Array.from({length:7},(_,i)=>({id:`job${i}`,userId:"user1",kind:"pdf_pack",objectKey:`private/exports/user1/job${i}/hskkit-pdf_pack.pdf`}));
  jobs[0].objectKey="system/artifacts/product.pdf";
  const deleted:string[]=[],cleared:string[]=[];
  const result=await cleanupExpiredExportObjects(jobs,{
    db:{prepare(){return {bind(id:unknown){return {async first(){return {state:id==="job1"?"ready":"expired",object_key:jobs.find(j=>j.id===id)?.objectKey} as never;}};}};}},
    store:{async head(key){if(key.includes("job6"))return null;return {customMetadata:{ownerUserId:key.includes("job2")?"other":"user1",jobId:key.split("/")[3]}};},async delete(key){if(key.includes("job3"))throw Error("network");deleted.push(key);}},
    async clear(id){cleared.push(id);},
  });
  assert.deepEqual(result,{inspected:7,deleted:2,missing:1,failed:1,skipped:3});
  assert.deepEqual(cleared,["job4","job5","job6"]);assert.equal(deleted.length,2);
});
