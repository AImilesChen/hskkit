const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {ListObjectsV2Command,GetObjectCommand,DeleteObjectsCommand}=require('@aws-sdk/client-s3');
const {createCacheClient}=require('./word-cache-r2.cjs');
const M=require('./reviewed-cache-cleanup.json'),BUCKET='hskkit-page-cache';
const APPROVED=new Map(M.candidates.map(c=>[c.build,c]));
const PROTECTED=new Set(M.protectedBuilds),GRACE=72*3600000;
assert.equal(M.bucket,BUCKET);assert.equal(APPROVED.size,9);assert.equal(PROTECTED.size,3);
assert.equal([...APPROVED.values()].reduce((n,c)=>n+c.objects,0),26364);
assert.equal([...APPROVED.values()].reduce((n,c)=>n+c.bytes,0),4799075118);
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function validateObject(o,now=Date.now()){
 const match=/^system\/opennext-cache\/([A-Za-z0-9_-]{21})\/[a-f0-9]{64}\.(cache|fetch)$/.exec(o.Key||'');
 assert.ok(match&&APPROVED.has(match[1])&&!PROTECTED.has(match[1]),'Object outside reviewed old-cache scope');
 assert.ok(Number.isSafeInteger(o.Size)&&o.Size>=0,'Invalid object size');
 const modified=new Date(o.LastModified).getTime();
 assert.ok(Number.isFinite(modified)&&modified<=now-GRACE,'Object is missing age or younger than 72 hours');
 return o;
}
async function deleteBatch(client,objects,guard,onResult=()=>{}){
 assert.ok(objects.length>0&&objects.length<=500,'Invalid batch size');
 for(const o of objects)validateObject(o);
 const map=new Map(objects.map(o=>[o.Key,o]));assert.equal(map.size,objects.length,'Duplicate key');
 await guard();
 const r=await client.send(new DeleteObjectsCommand({Bucket:BUCKET,Delete:{Objects:objects.map(o=>({Key:o.Key})),Quiet:false}}),{abortSignal:AbortSignal.timeout(60000)});
 const done=r.Deleted||[],errors=r.Errors||[];const names=new Set();
 for(const o of [...done,...errors]){assert.ok(map.has(o.Key),'Unknown response key');assert.ok(!names.has(o.Key),'Repeated response key');names.add(o.Key);}
 onResult({confirmedObjects:done.length,confirmedBytes:done.reduce((n,o)=>n+map.get(o.Key).Size,0),errors:errors.map(e=>({key:e.Key,code:e.Code}))});
 assert.equal(errors.length,0,'Cloudflare reported partial deletion errors');
 assert.equal(done.length,objects.length,'Cloudflare did not confirm every requested key');
 return done.length;
}
async function list(client,prefix=''){
 const items=[];let token;const tokens=new Set();
 for(let page=0;page<500;page++){
  const r=await client.send(new ListObjectsV2Command({Bucket:BUCKET,Prefix:prefix,MaxKeys:1000,...(token?{ContinuationToken:token}:{})}),{abortSignal:AbortSignal.timeout(30000)});
  items.push(...(r.Contents||[]));if(!r.IsTruncated)return items;
  assert.ok(r.NextContinuationToken&&!tokens.has(r.NextContinuationToken),'Incomplete object listing');tokens.add(r.NextContinuationToken);token=r.NextContinuationToken;
 }throw Error('Object listing budget exceeded');
}
const apiBase='https://api.cloudflare.com/client/v4/accounts/77bc392d46985cd3425691358f5e8a77/';
async function cf(suffix){
 const r=await fetch(apiBase+suffix,{method:'GET',headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN},redirect:'error',signal:AbortSignal.timeout(20000)});
 assert.ok(r.ok,'Cloudflare read failed: '+r.status);const j=await r.json();assert.equal(j.success,true,'Cloudflare read rejected');return j.result;
}
async function readPublic(url){
 const r=await fetch(new URL(url,'https://hskkit.com'),{method:'GET',headers:{'User-Agent':'Mozilla/5.0 HSKKit bounded cache-cleanup verification'},redirect:'error',signal:AbortSignal.timeout(30000)});
 return {status:r.status,cache:r.headers.get('x-opennext-cache'),control:r.headers.get('cache-control'),bytes:Buffer.from(await r.arrayBuffer())};
}
async function guard(){
 const [d,b,s]=await Promise.all([cf('workers/scripts/hskkit/deployments'),readPublic('/BUILD_ID'),cf('workers/scripts/hskkit/subdomain')]);
 const active=d.deployments?.[0];assert.equal(active?.id,M.expectedDeployment,'Production deployment changed');
 assert.deepEqual(active.versions,[{version_id:M.expectedVersion,percentage:100}],'Production traffic changed');
 assert.equal(b.status,200);assert.equal(b.bytes.toString().trim(),M.expectedBuild,'Production build changed');
 assert.equal(s.previews_enabled,false,'Version previews became enabled');
 return {build:M.expectedBuild,version:M.expectedVersion,deployment:M.expectedDeployment};
}
async function consumers(){
 const scripts=await cf('workers/scripts'),refs=[];
 for(let i=0;i<scripts.length;i+=4){const rows=await Promise.all(scripts.slice(i,i+4).map(async s=>{
  const settings=await cf('workers/scripts/'+encodeURIComponent(s.id)+'/settings');
  return (settings.bindings||[]).some(b=>b.type==='r2_bucket'&&b.bucket_name===BUCKET)?s.id:null;
 }));refs.push(...rows.filter(Boolean));}
 assert.deepEqual(refs.sort(),['hskkit'],'Unexpected page-cache consumer');return refs;
}
async function quickHealth(){
 const r=await readPublic('/word/hsk2025.word.l1.0007.v1');assert.equal(r.status,200);assert.equal(r.cache,'HIT');assert.ok(r.bytes.toString().includes('dictionary-word-hanzi'));return {status:r.status,cache:r.cache};
}
async function pages(){
 const routes=[['/',200],['/dictionary',200],['/word/hsk2025.word.l1.0007.v1',200],['/word/hsk2025.word.l1.0007.v1/practice',200],['/word/hsk2025.word.l6.4559.v1',200],['/word/hsk3.word.l7.1831.v1',404],['/api/v1/account',200],['/api/v1/account/learning-rewards',401],['/api/v1/commercial/exports',401]];
 const rows=[];let wordHtml='';
 for(const [url,status] of routes){const r=await readPublic(url);assert.equal(r.status,status,'Page health: '+url);
  if(url.startsWith('/api/'))assert.ok(r.control?.includes('no-store'),'Private API caching');
  if(url==='/api/v1/account')assert.equal(JSON.parse(r.bytes).account,null);
  if(url==='/word/hsk2025.word.l1.0007.v1')wordHtml=r.bytes.toString();
  if(url.startsWith('/word/hsk2025.'))assert.equal(r.cache,'HIT','Current word cache must stay hot');
  rows.push({url,status:r.status,cache:r.cache});
 }
 const refs=[...new Set([...wordHtml.matchAll(/(?:href|src)="(\/_next\/static\/[^"<>]+)"/g)].map(x=>x[1]))];
 const styles=refs.filter(x=>/\.css(?:\?|$)/.test(x));assert.ok(styles.length>0,'No current stylesheet');
 const assets=[];const fonts=[];
 for(const url of styles){const r=await readPublic(url);assert.equal(r.status,200);assets.push({url,sha256:sha(r.bytes),bytes:r.bytes.length});
  for(const match of r.bytes.toString().matchAll(/url\(["']?([^)'"\s]+\.woff2)["']?\)/g))fonts.push(new URL(match[1],new URL(url,'https://hskkit.com')).href);
 }
 const targets=[...refs.filter(x=>/\.js(?:\?|$)/.test(x)).slice(0,2),...new Set(fonts)].slice(0,6);
 for(const url of targets){const r=await readPublic(url);assert.equal(r.status,200);assets.push({url,sha256:sha(r.bytes),bytes:r.bytes.length});}
 return {rows,assets};
}
async function canaries(client){
 const result=[];
 for(const build of PROTECTED){const r=await client.send(new ListObjectsV2Command({Bucket:BUCKET,Prefix:'system/opennext-cache/'+build+'/',MaxKeys:2}));assert.ok(r.Contents?.length,'Protected cache missing');
  for(const o of r.Contents){const data=await client.send(new GetObjectCommand({Bucket:BUCKET,Key:o.Key}),{abortSignal:AbortSignal.timeout(30000)});result.push({key:o.Key,sha256:sha(Buffer.from(await data.Body.transformToByteArray()))});}
 }return result;
}
async function checkCanaries(client,expected){
 for(const o of expected){const r=await client.send(new GetObjectCommand({Bucket:BUCKET,Key:o.key}),{abortSignal:AbortSignal.timeout(30000)});assert.equal(sha(Buffer.from(await r.Body.transformToByteArray())),o.sha256,'Protected cache changed');}
}
function inventory(items){return {objects:items.length,bytes:items.reduce((n,o)=>n+o.Size,0)};}
module.exports={validateObject,deleteBatch,M};
if(require.main===module)(async()=>{
 assert.equal(process.env.CACHE_CLEANUP_APPROVED,'reviewed-9-directories-20261113','Reviewed-scope approval missing');
 assert.ok(process.env.RUNNER_TEMP,'Missing report directory');
 const output=process.env.RUNNER_TEMP,report={startedAt:new Date().toISOString(),scope:'nine reviewed old page-cache prefixes',sourceCommit:M.sourceCommit,protectedBuilds:[...PROTECTED],batches:[],deletedObjects:0,deletedBytes:0,applicationDeployments:0,databaseWrites:0,status:'checking'};
 const save=()=>fs.writeFileSync(path.join(output,'cache-cleanup-report.json'),JSON.stringify(report,null,2));save();
 const client=await createCacheClient();
 try{
  report.baseline=await guard();report.consumersBefore=await consumers();report.pagesBefore=await pages();report.protectedCanaries=await canaries(client);save();
  const all=await list(client);report.before=inventory(all);const selected=[];
  for(const c of APPROVED.values()){
   const objects=all.filter(o=>o.Key.startsWith('system/opennext-cache/'+c.build+'/'));objects.forEach(o=>validateObject(o));
   assert.equal(objects.length,c.objects,'Reviewed object count changed');assert.equal(inventory(objects).bytes,c.bytes,'Reviewed object size changed');selected.push(...objects);
  }
  assert.equal(selected.length,26364);assert.equal(inventory(selected).bytes,4799075118);
  fs.writeFileSync(path.join(output,'cache-cleanup-object-manifest.json'),JSON.stringify(selected));
  report.selected=inventory(selected);report.status='deleting';save();
  for(let i=0;i<selected.length;i+=500){const objects=selected.slice(i,i+500);
   await deleteBatch(client,objects,guard,r=>{report.deletedObjects+=r.confirmedObjects;report.deletedBytes+=r.confirmedBytes;report.batches.push({number:report.batches.length+1,...r});save();});
   if(i===0||report.batches.length%10===0)await quickHealth();
   console.log(JSON.stringify({deletedObjects:report.deletedObjects,selectedObjects:selected.length,deletedBytes:report.deletedBytes}));
  }
  report.identityAfter=await guard();report.consumersAfter=await consumers();
  await checkCanaries(client,report.protectedCanaries);report.protectedCanariesUnchanged=true;
  report.pagesAfter=await pages();assert.deepEqual(report.pagesAfter.assets,report.pagesBefore.assets,'Current CSS/JS/font assets changed');report.staticAssetsUnchanged=true;
  const after=await list(client);report.after=inventory(after);
  for(const c of APPROVED.values())assert.equal(after.filter(o=>o.Key.startsWith('system/opennext-cache/'+c.build+'/')).length,0,'Candidate prefix not empty');
  assert.equal(report.deletedObjects,26364);assert.equal(report.deletedBytes,4799075118);
  report.identityFinal=await guard();
  report.completedAt=new Date().toISOString();report.status='complete';save();
  console.log(JSON.stringify({status:report.status,deletedObjects:report.deletedObjects,deletedBytes:report.deletedBytes,before:report.before,after:report.after,protectedCanariesUnchanged:true,staticAssetsUnchanged:true,productionUnchanged:true,applicationDeployments:0}));
 }catch(error){report.status='stopped';report.error={name:error.name,message:error.message};report.stoppedAt=new Date().toISOString();save();console.error('Cleanup stopped:',error.message);process.exitCode=1;}
 finally{client.destroy();}
})().catch(error=>{console.error('Cleanup did not start:',error.message);process.exitCode=1;});
