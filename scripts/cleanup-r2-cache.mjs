// One approved batch. Dry-run by default; no arbitrary bucket or prefix inputs.
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';

const ACCOUNT = '77bc392d46985cd3425691358f5e8a77';
const BUCKET = 'hskkit-commercial-exports';
const PREFIX = 'system/opennext-cache/';
const CUTOFF = '2026-11-04T00:00:00.000Z';
const INVENTORY_SHA = '30a2db3704e90a60eb6c901c115bbfc4ebb767d21dfff251f85f09096d146046';
export const APPROVED_SCOPE_SHA = 'c5a007413a7d9949002d15fd0c3606f40067d1f2f3394d7134c44334f658720d';
const sha = value => createHash('sha256').update(value).digest('hex');
const fail = message => { const error=new Error(message); error.name='CleanupGuardError'; throw error; };

export function approvedScope(report) {
  if (report.bucket !== BUCKET || report.cachePrefix !== PREFIX || report.inventoryMetadataSha256 !== INVENTORY_SHA || report.mode !== 'read-only') fail('Wrong source inventory');
  const remove = Object.keys(report.cacheBuilds).filter(id => id !== report.activeBuild && new Date(report.cacheBuilds[id].latest) < new Date(CUTOFF)).sort();
  const keep = Object.keys(report.cacheBuilds).filter(id => !remove.includes(id)).sort();
  const scope = { bucket: BUCKET, prefix: PREFIX, cutoff: CUTOFF, activeBuild: report.activeBuild,
    remove: remove.map(build => { const g=report.cacheBuilds[build]; return {build,bytes:g.bytes,earliest:g.earliest,latest:g.latest,objects:g.objects}; }), keep };
  if (sha(JSON.stringify(scope)) !== APPROVED_SCOPE_SHA || remove.length !== 40 || keep.length !== 14) fail('The approved 40-prefix scope changed');
  if (scope.remove.reduce((n,g)=>n+g.bytes,0)!==8375137150 || scope.remove.reduce((n,g)=>n+g.objects,0)!==85336) fail('The approved totals changed');
  return scope;
}

export function verifyPrefix(items, build, expected) {
  if (!/^[A-Za-z0-9_-]{21}$/.test(build)) fail('Invalid build ID');
  const prefix=PREFIX+build+'/';
  const seen=new Set();
  let bytes=0, earliest=Infinity, latest=-Infinity;
  for (const obj of items) {
    if (typeof obj.Key !== 'string' || !obj.Key.startsWith(prefix) || !/^[a-f0-9]{64}\.(cache|fetch)$/.test(obj.Key.slice(prefix.length)) || seen.has(obj.Key)) fail('Unexpected key outside the exact old cache prefix');
    if (!Number.isSafeInteger(obj.Size) || obj.Size<0) fail('Invalid size');
    const time=new Date(obj.LastModified).getTime();
    if (!Number.isFinite(time) || time>=new Date(CUTOFF).getTime()) fail('Old cache acquired a recent write');
    earliest=Math.min(earliest,time); latest=Math.max(latest,time); bytes+=obj.Size; seen.add(obj.Key);
  }
  if (items.length!==expected.objects || bytes!==expected.bytes || earliest!==Date.parse(expected.earliest) || latest!==Date.parse(expected.latest)) fail('Old-prefix metadata changed since approval');
}

async function cf(path) {
  const response=await fetch('https://api.cloudflare.com/client/v4/'+path,{headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN},redirect:'error',signal:AbortSignal.timeout(30000)});
  if (!response.ok) fail('Cloudflare read returned HTTP '+response.status);
  const body=await response.json(); if(body.success!==true) fail('Cloudflare read did not succeed'); return body.result;
}

async function liveBuild() {
  const response=await fetch('https://hskkit.com/BUILD_ID',{signal:AbortSignal.timeout(20000)});
  if(!response.ok) fail('Live build check failed');
  const value=(await response.text()).trim(); if(!/^[A-Za-z0-9_-]{21}$/.test(value)) fail('Invalid live build response'); return value;
}

async function references() {
  const scripts=await cf(`accounts/${ACCOUNT}/workers/scripts`);
  let cacheUsers=0;
  for (const script of scripts) {
    const settings=await cf(`accounts/${ACCOUNT}/workers/scripts/${encodeURIComponent(script.id)}/settings`);
    const bindings=settings.bindings??[];
    const cache=bindings.some(b=>b.type==='r2_bucket'&&b.name==='NEXT_INC_CACHE_R2_BUCKET'&&b.bucket_name===BUCKET);
    if(cache){
      cacheUsers++;
      if(script.id!=='hskkit'||!bindings.some(b=>b.type==='plain_text'&&b.name==='NEXT_INC_CACHE_R2_PREFIX'&&b.text===PREFIX.slice(0,-1))) fail('Unexpected cache consumer');
    }
  }
  if(cacheUsers!==1) fail('Cache references changed');
}

async function s3() {
  const token=process.env.CLOUDFLARE_API_TOKEN; if(!token) fail('Missing deployment credential');
  const path=token.startsWith('cfat_')?`accounts/${ACCOUNT}/tokens/verify`:'user/tokens/verify';
  const verified=await cf(path);
  if(verified.status!=='active'||!/^[a-f0-9]{32}$/.test(verified.id)) fail('Existing credential verification failed');
  // Reuse the existing token's documented S3 representation. Do not create,
  // expose, persist, or transmit credentials to any new destination.
  const secret=sha(token);
  if(process.env.GITHUB_ACTIONS==='true') console.log('::add-mask::'+secret);
  return new S3Client({region:'auto',endpoint:`https://${ACCOUNT}.r2.cloudflarestorage.com`,forcePathStyle:true,maxAttempts:3,
    credentials:{accessKeyId:verified.id,secretAccessKey:secret}});
}

async function list(client,prefix,maxKeys=1000) {
  const items=[],seen=new Set(); let cursor;
  for(let page=0;page<300;page++){
    const result=await client.send(new ListObjectsV2Command({Bucket:BUCKET,Prefix:prefix,MaxKeys:maxKeys,...(cursor?{ContinuationToken:cursor}:{})}));
    for(const obj of result.Contents??[]) {if(!obj.Key?.startsWith(prefix)) fail('Listing escaped requested prefix'); items.push(obj);}
    if(!result.IsTruncated)return items;
    if(!result.NextContinuationToken||seen.has(result.NextContinuationToken))fail('Incomplete listing');
    cursor=result.NextContinuationToken;seen.add(cursor);
  }
  fail('Listing exceeded bound');
}

function fingerprint(items) {
  const data=items.map(o=>[o.Key,o.Size,new Date(o.LastModified).toISOString(),o.ETag]).sort((a,b)=>a[0].localeCompare(b[0]));
  return {objects:items.length,bytes:items.reduce((n,o)=>n+o.Size,0),metadataSha256:sha(JSON.stringify(data))};
}

async function pool(values, fn) {
  let i=0;const out=new Array(values.length);
  await Promise.all(Array.from({length:4},async()=>{while(i<values.length){const at=i++;out[at]=await fn(values[at]);}}));return out;
}

async function main() {
  const args=process.argv.slice(2); const option=name=>args[args.indexOf(name)+1];
  if(!args.includes('--report')||!args.includes('--output'))fail('Report and output paths required');
  const report=JSON.parse(await readFile(option('--report'),'utf8')); const scope=approvedScope(report);
  const apply=args.includes('--apply');
  if(apply&&process.env.APPROVED_R2_CLEANUP_SHA!==APPROVED_SCOPE_SHA)fail('Explicit approval hash required');
  if(Date.now()-Date.parse(report.completedAt)>8*3600000)fail('Inventory is stale');
  if(await liveBuild()!==scope.activeBuild)fail('Production build changed; no deletion');
  await references(); const client=await s3();
  const protectedBefore={};
  for(const prefix of ['system/artifacts/','system/fonts/'])protectedBefore[prefix]=fingerprint(await list(client,prefix));
  const prepared=await pool(scope.remove,async group=>{const items=await list(client,PREFIX+group.build+'/');verifyPrefix(items,group.build,group);return {group,items};});
  console.log(JSON.stringify({phase:'preflight-passed',oldBuilds:40,objects:85336,bytes:8375137150,protectedPrefixes:2,mode:apply?'apply':'dry-run'}));
  if(await liveBuild()!==scope.activeBuild)fail('Production changed after preflight');
  let deleted=0;
  if(apply){
    for(const {group,items} of prepared){
      if(await liveBuild()!==scope.activeBuild)fail('Production changed during cleanup; stopped');
      // Revalidate every whole prefix immediately before deleting its first batch.
      const fresh=await list(client,PREFIX+group.build+'/');verifyPrefix(fresh,group.build,group);
      if(fingerprint(fresh).metadataSha256!==fingerprint(items).metadataSha256)fail('Old-prefix contents changed during preflight');
      for(let start=0;start<items.length;start+=1000){
        const keys=items.slice(start,start+1000).map(o=>({Key:o.Key}));
        let result;
        try { result=await client.send(new DeleteObjectsCommand({Bucket:BUCKET,Delete:{Objects:keys,Quiet:false}})); }
        catch(error) { error.cleanupPhase='delete-objects'; throw error; }
        if(result.Errors?.length||result.Deleted?.length!==keys.length)fail('Batch delete was incomplete; stopped');
        const permitted=new Set(keys.map(k=>k.Key));
        if(result.Deleted.some(k=>!permitted.has(k.Key)))fail('Delete response mismatch');
        deleted+=result.Deleted.length;
      }
      console.log(JSON.stringify({phase:'progress',deletedObjects:deleted}));
    }
    for(const {group} of prepared)if((await list(client,PREFIX+group.build+'/')).length)fail('Selected old prefix is not empty');
  }
  const protectedAfter={};
  for(const prefix of Object.keys(protectedBefore)){
    protectedAfter[prefix]=fingerprint(await list(client,prefix));
    if(JSON.stringify(protectedAfter[prefix])!==JSON.stringify(protectedBefore[prefix]))fail('Protected resources changed; investigate');
  }
  if(await liveBuild()!==scope.activeBuild)fail('Production changed during verification');
  const output={mode:apply?'applied':'dry-run',approvedScopeSha:APPROVED_SCOPE_SHA,deletedObjects:deleted,deletedBytes:apply?8375137150:0,
    removedBuilds:apply?40:0,retainedBuilds:14,protectedBefore,protectedAfter,completedAt:new Date().toISOString()};
  await writeFile(option('--output'),JSON.stringify(output,null,2));console.log('R2_CLEANUP_RESULT '+JSON.stringify(output));
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  main().catch(error=>{
    const remoteName=typeof error?.name==='string'&&/^[A-Za-z]{1,80}$/.test(error.name)?error.name:'RemoteError';
    console.error('R2 cleanup stopped:',error instanceof Error&&error.name==='CleanupGuardError'?error.message:
      JSON.stringify({phase:error?.cleanupPhase??'preflight',type:remoteName,httpStatus:error?.$metadata?.httpStatusCode??null}));
    process.exitCode=1;
  });
}
