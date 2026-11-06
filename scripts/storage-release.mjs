import {readFile, writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {waitForPublishedBuild} from './storage-build-check.mjs';

const ACCOUNT='77bc392d46985cd3425691358f5e8a77';
const CACHE_BUCKET='hskkit-page-cache';
const API=`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/`;
async function cf(path,options={}) {
  const response=await fetch(API+path,{...options,headers:{Authorization:`Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,...(options.body?{'Content-Type':'application/json'}:{})},redirect:'error',signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw Error(`CLOUDFLARE_HTTP_${response.status}`);
  const body=await response.json();if(body.success!==true)throw Error('CLOUDFLARE_REQUEST_FAILED');return body.result;
}
async function inspect() {
  const main=await cf('workers/scripts/hskkit/settings');
  const commercial=await cf('workers/scripts/hskkit-commercial-export-worker/settings');
  const schedules=await cf('workers/scripts/hskkit-commercial-export-worker/schedules');
  const deployments=await cf('workers/scripts/hskkit/deployments');
  // This report intentionally excludes plain-text environment values, users,
  // script content, credentials and object names.
  return {checkedAt:new Date().toISOString(),mainR2:(main.bindings??[]).filter(b=>b.type==='r2_bucket').map(b=>({binding:b.name,bucket:b.bucket_name})),commercialR2:(commercial.bindings??[]).filter(b=>b.type==='r2_bucket').map(b=>({binding:b.name,bucket:b.bucket_name})),commercialBindingNames:(commercial.bindings??[]).map(b=>({name:b.name,type:b.type})),cacheCleanupMode:(commercial.bindings??[]).find(b=>b.name==='STORAGE_CACHE_CLEANUP_MODE')?.text??'not-configured',schedules,activeVersions:deployments.deployments?.[0]?.versions??deployments[0]?.versions??[]};
}
async function ensureBucket() {
  try {await cf(`r2/buckets/${CACHE_BUCKET}`);}
  catch(error){if(error.message!=='CLOUDFLARE_HTTP_404')throw error;await cf('r2/buckets',{method:'POST',body:JSON.stringify({name:CACHE_BUCKET})});}
  console.log('Dedicated page-cache bucket is available');
}
async function register() {
  const version=process.env.STORAGE_WORKER_VERSION;
  const build=(await readFile('.next/BUILD_ID','utf8')).trim();
  if(!/^[a-f0-9-]{36}$/.test(version??'')||!/^[A-Za-z0-9_-]{21}$/.test(build))throw Error('INVALID_RELEASE_IDENTITY');
  const deployments=await cf('workers/scripts/hskkit/deployments');
  const versions=(deployments.deployments??deployments)[0]?.versions;
  if(versions?.length!==1||versions[0].version_id!==version||versions[0].percentage!==100)throw Error('DEPLOYMENT_NOT_EXCLUSIVELY_ACTIVE');
  await waitForPublishedBuild(build);
  const fresh=await cf('workers/scripts/hskkit/deployments');
  const freshVersions=(fresh.deployments??fresh)[0]?.versions;
  if(freshVersions?.length!==1||freshVersions[0].version_id!==version||freshVersions[0].percentage!==100)throw Error('DEPLOYMENT_CHANGED_DURING_VERIFICATION');
  const deployedAt=Date.now();
  const record={schemaVersion:1,worker:'hskkit',version,build,bucket:CACHE_BUCKET,prefix:'system/opennext-cache/',deployedAt:new Date(deployedAt).toISOString(),commit:process.env.GITHUB_SHA};
  const file=`${process.env.RUNNER_TEMP}/hskkit-cache-release.json`;
  await writeFile(file,JSON.stringify(record));
  const key=`${CACHE_BUCKET}/system/cache-releases/${deployedAt}-${version}-${build}.json`;
  const result=spawnSync(process.platform==='win32'?'npx.cmd':'npx',['wrangler','r2','object','put',key,'--file',file,'--content-type','application/json','--remote'],{stdio:'inherit',env:process.env});
  if(result.status!==0)throw Error('RELEASE_RECORD_UPLOAD_FAILED');
  console.log('Verified active release was registered');
}
async function runtimeReport() {
  const reports={checkedAt:new Date().toISOString(),cache:null,legacy:null};
  for(const [label,name] of [['cache','cache-latest.json'],['legacy','legacy-latest.json']]){
    const file=`${process.env.RUNNER_TEMP}/hskkit-${name}`;
    const result=spawnSync(process.platform==='win32'?'npx.cmd':'npx',['wrangler','r2','object','get',`${CACHE_BUCKET}/system/maintenance/${name}`,'--file',file,'--remote'],{stdio:'pipe',env:process.env});
    if(result.status===0){
      const value=JSON.parse(await readFile(file,'utf8'));
      // These files are written by our cron and contain aggregate counts only.
      if(value.schemaVersion===1||label==='legacy')reports[label]=value;
    }
  }
  return reports;
}
try {
  const task=process.argv[2];
  if(!process.env.CLOUDFLARE_API_TOKEN)throw Error('MISSING_DEPLOYMENT_CREDENTIAL');
  if(task==='inspect'||task==='verify'){
    const report=await inspect();await writeFile(process.argv[3],JSON.stringify(report,null,2));
    if(task==='verify'){
      if(!report.mainR2.some(b=>b.binding==='NEXT_INC_CACHE_R2_BUCKET'&&b.bucket===CACHE_BUCKET)||!report.mainR2.some(b=>b.binding==='COMMERCIAL_EXPORTS_R2'&&b.bucket==='hskkit-commercial-exports')||!report.commercialR2.some(b=>b.binding==='PAGE_CACHE_R2'&&b.bucket===CACHE_BUCKET)||report.cacheCleanupMode!=='apply'||(report.schedules.schedules??[]).every(s=>s.cron!=='*/15 * * * *'))throw Error('STORAGE_DEPLOYMENT_MISMATCH');
    }
    console.log('Read-only storage deployment inspection completed');
  }else if(task==='ensure-bucket')await ensureBucket();
  else if(task==='register')await register();
  else if(task==='runtime'){
    await writeFile(process.argv[3],JSON.stringify(await runtimeReport(),null,2));
    console.log('Aggregate maintenance runtime report saved');
  }
  else throw Error('UNKNOWN_STORAGE_RELEASE_TASK');
}catch(error){console.error('Storage release stopped:',/^[A-Z_0-9]+$/.test(error.message)?error.message:'REMOTE_OPERATION_FAILED');process.exitCode=1;}
