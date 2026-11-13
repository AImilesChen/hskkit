// Exercise built Worker cache hits and private-media guards in local workerd.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const S=path.resolve(__dirname,'..'),root=path.join(S,'.open-next'),T=fs.mkdtempSync(path.join(root,'.cache-check-'));
process.chdir(S);process.env.WRANGLER_SEND_METRICS='false';process.env.WRANGLER_LOG_PATH=path.join(T,'logs');
// This is a local-only test. Do not let production credentials affect Wrangler
// discovery or local binding startup inside the production job environment.
for(const key of ['CLOUDFLARE_API_TOKEN','CLOUDFLARE_API_KEY','CF_API_TOKEN','CF_API_KEY','CLOUDFLARE_ACCOUNT_ID'])delete process.env[key];
const {unstable_startWorker}=require('wrangler');
const common={compatibilityDate:'2026-05-24',compatibilityFlags:['nodejs_compat','global_fetch_strictly_public'],sendMetrics:false,envFiles:[],dev:{remote:false,persist:path.join(T,'state'),server:{port:0},inspector:false,watch:false,liveReload:false,logLevel:'error'}};
const checkStarted=Date.now();
const progress=message=>console.log(`cache-check (${Math.round((Date.now()-checkStarted)/1000)}s): ${message}`);
async function bounded(label,promise,ms=30000){let timer;try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error(`Local verification timed out: ${label}`)),ms);})]);}finally{clearTimeout(timer);}}
async function checkedFetch(worker,url,init){progress('request '+url);const result=await bounded(url,worker.fetch(url,init));progress('received '+result.status+' '+url);return result;}
async function discard(response){if(response.body)await bounded('discard response body',response.body.cancel(),10000);}
(async()=>{
 // Bundling, hashing the growing media inventory and starting local workerd have
 // their own cost. Keep individual requests bounded instead of conflating setup
 // with a hung request. No production setting or application timeout is changed.
 const deadline=setTimeout(()=>{console.error('Local verification exceeded six minutes including setup.');process.exit(1);},360000);deadline.unref();
 progress('bundling local probe');
 const src=fs.readFileSync(path.join(root,'worker.js'),'utf8');assert.ok(src.includes('return reqOrResp;')&&src.includes('return handler(reqOrResp, env, ctx, request.signal);'));
 assert.ok(src.includes('if (anonymousResponse) return anonymousResponse;'));
 const probe=path.join(root,'worker.cache-probe.js');fs.writeFileSync(probe,src.replace('return reqOrResp;','reqOrResp.headers.set("x-local-next-dispatched","0"); return reqOrResp;').replace('if (anonymousResponse) return anonymousResponse;','if (anonymousResponse) { anonymousResponse.headers.set("x-local-next-dispatched","0"); return anonymousResponse; }').replace('if (missingWord) return missingWord;', 'if (missingWord) { missingWord.headers.set("x-local-next-dispatched","0"); return missingWord; }').replace('return handler(reqOrResp, env, ctx, request.signal);','const result=await handler(reqOrResp, env, ctx, request.signal); result.headers.set("x-local-next-dispatched","1"); return result;'));
 const localConfig=path.join(T,'wrangler.json');fs.writeFileSync(localConfig,JSON.stringify({name:'hskkit-local-cache-check',main:probe,compatibility_date:'2026-05-24',compatibility_flags:common.compatibilityFlags,assets:{directory:path.join(root,'assets'),binding:'ASSETS',run_worker_first:['/formal-media/*']},vars:{NEXT_INC_CACHE_R2_PREFIX:'system/opennext-cache'},r2_buckets:[{binding:'NEXT_INC_CACHE_R2_BUCKET',bucket_name:'hskkit-page-cache'}]}));
 const out=spawnSync(process.execPath,[path.join(S,'node_modules/wrangler/bin/wrangler.js'),'deploy',probe,'--config',localConfig,'--dry-run','--outdir',path.join(T,'bundle')],{cwd:S,encoding:'utf8',env:process.env,timeout:120000});assert.equal(out.status,0,((out.stdout||'')+(out.stderr||'')).slice(-4000));
 progress('seeding isolated local R2');
 const cacheRoot=path.join(root,'cache'),build=fs.readdirSync(cacheRoot).find(f=>!f.startsWith('__'));
 const files=['dictionary.cache','levels.cache','hsk-test-prep.cache','pricing.cache','chinese-course-tests.cache','word/hsk2025.word.l1.0102.v1.cache','word/hsk2025.word.l1.0102.v1/practice.cache'];
 const writer=await unstable_startWorker({...common,name:'local-cache-fixture',config:'',entrypoint:path.join(S,'node_modules/@opennextjs/cloudflare/dist/cli/workers/r2-cache.js'),bindings:{R2:{type:'r2_bucket',bucket_name:'hskkit-page-cache'}}});
 try{for(const file of files){const key='/'+file.slice(0,-6),hash=crypto.createHash('sha256').update(key).digest('hex'),body=fs.readFileSync(path.join(cacheRoot,build,file));const r=await fetch(new URL('/populate',await writer.url),{method:'POST',headers:{'content-length':String(body.length),'x-opennext-cache-key':`system/opennext-cache/${build}/${hash}.cache`},body});assert.equal(r.status,200,await r.text());}}finally{await writer.dispose();}
 progress('starting built local worker');
 const worker=await unstable_startWorker({...common,name:'hskkit-local-cache-check',config:localConfig,entrypoint:path.join(T,'bundle/worker.cache-probe.js'),build:{bundle:false},assets:path.join(root,'assets')});
 const checks=[];
 try{
  for(const file of files){const route='/'+file.slice(0,-6);progress(route);const r=await checkedFetch(worker,'http://localhost'+route),body=await bounded('read '+route,r.text());assert.equal(r.status,200,route);assert.equal(r.headers.get('x-local-next-dispatched'),'0',route);assert.ok(body.includes('HSKKit'));checks.push({route,status:200,nextServerDispatch:0});}
  for(const route of ['/formal-media/course-chinese-1-b-v1/index.coursedoc','/%66ormal-media/course-chinese-1-b-v1/index.coursedoc','/api/v1/course-tests/chinese-1/b/file/paper-data.json','/api/v1/course-tests/chinese-1/c/file/teacher.pdf','/formal-media/course-chinese-2-b-v1/index.coursedoc','/%66ormal-media/course-chinese-2-c-v1/paper-data.json','/api/v1/course-tests/chinese-2/b/file/paper-data.json','/api/v1/course-tests/chinese-2/c/file/teacher.pdf']){progress('guard '+route);const expected=route.startsWith('/api/')?401:404,r=await checkedFetch(worker,'http://localhost'+route);assert.equal(r.status,expected,route);await discard(r);checks.push({route,status:expected});}
  for(const query of ['?x=1','?_rsc=fixture']){const r=await checkedFetch(worker,'http://localhost/chinese-course-tests'+query);assert.equal(r.status,200);await discard(r);}
  progress('RSC response');const flight=await checkedFetch(worker,'http://localhost/chinese-course-tests?_rsc=fixture',{headers:{rsc:'1','next-router-prefetch':'1'}});assert.equal(flight.status,200);assert.ok(flight.headers.get('content-type')?.includes('text/x-component'));await discard(flight);
  progress('missing word document bypasses Next');
  for(const route of ['/word/hsk3.word.l7.1831.v1','/word/hsk3.word.l7.1831.v1/practice']){
   const response=await checkedFetch(worker,'http://localhost'+route);
   assert.equal(response.status,404);assert.equal(response.headers.get('x-local-next-dispatched'),'0');
   assert.match(response.headers.get('x-robots-tag'),/noindex/);
   assert.equal(await response.text(),fs.readFileSync(path.join(S,'.next/server/app/_not-found.html'),'utf8'));
   checks.push({route,status:404,nextServerDispatch:0});
  }
  progress('stateless account');const anon=await checkedFetch(worker,'http://localhost/api/v1/account');assert.equal(anon.headers.get('x-local-next-dispatched'),'0');assert.equal(anon.headers.get('cache-control'),'private, no-store');assert.equal((await anon.json()).account,null);
  const reward=await checkedFetch(worker,'http://localhost/api/v1/account/learning-rewards',{method:'POST',body:'invalid-json'});assert.equal(reward.status,401);assert.equal(reward.headers.get('x-local-next-dispatched'),'0');await discard(reward);
  const cookie=await checkedFetch(worker,'http://localhost/api/v1/account',{headers:{cookie:'consent=fixture'}});assert.equal(cookie.status,200);assert.equal(cookie.headers.get('x-local-next-dispatched'),'1');await discard(cookie);
 }finally{await worker.dispose();}
 console.log(JSON.stringify({environment:'local workerd',checks,queryChecks:2,flightResponse:true,statelessAccountChecks:3,productionProbeHeaders:false}));
})().catch(error=>{console.error(error);process.exitCode=1});
