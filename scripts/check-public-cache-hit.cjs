// Exercise built Worker cache hits and private-media guards in local workerd.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const S=path.resolve(__dirname,'..'),root=path.join(S,'.open-next'),T=fs.mkdtempSync(path.join(root,'.cache-check-'));
process.chdir(S);process.env.WRANGLER_SEND_METRICS='false';process.env.WRANGLER_LOG_PATH=path.join(T,'logs');
const {unstable_startWorker}=require('wrangler');
const common={compatibilityDate:'2026-05-24',compatibilityFlags:['nodejs_compat','global_fetch_strictly_public'],sendMetrics:false,envFiles:[],dev:{remote:false,persist:path.join(T,'state'),server:{port:0},inspector:false,watch:false,liveReload:false,logLevel:'error'}};
(async()=>{
 const src=fs.readFileSync(path.join(root,'worker.js'),'utf8');assert.ok(src.includes('return reqOrResp;')&&src.includes('return handler(reqOrResp, env, ctx, request.signal);'));
 assert.ok(src.includes('if (anonymousResponse) return anonymousResponse;'));
 const probe=path.join(root,'worker.cache-probe.js');fs.writeFileSync(probe,src.replace('return reqOrResp;','reqOrResp.headers.set("x-local-next-dispatched","0"); return reqOrResp;').replace('if (anonymousResponse) return anonymousResponse;','if (anonymousResponse) { anonymousResponse.headers.set("x-local-next-dispatched","0"); return anonymousResponse; }').replace('return handler(reqOrResp, env, ctx, request.signal);','const result=await handler(reqOrResp, env, ctx, request.signal); result.headers.set("x-local-next-dispatched","1"); return result;'));
 const out=spawnSync(process.execPath,[path.join(S,'node_modules/wrangler/bin/wrangler.js'),'deploy',probe,'--config',path.join(S,'wrangler.jsonc'),'--dry-run','--outdir',path.join(T,'bundle')],{cwd:S,encoding:'utf8',env:process.env});assert.equal(out.status,0,((out.stdout||'')+(out.stderr||'')).slice(-4000));
 const cacheRoot=path.join(root,'cache'),build=fs.readdirSync(cacheRoot).find(f=>!f.startsWith('__'));
 const files=['dictionary.cache','levels.cache','hsk-test-prep.cache','pricing.cache','chinese-course-tests.cache'];
 const writer=await unstable_startWorker({...common,name:'local-cache-fixture',config:'',entrypoint:path.join(S,'node_modules/@opennextjs/cloudflare/dist/cli/workers/r2-cache.js'),bindings:{R2:{type:'r2_bucket',bucket_name:'hskkit-page-cache'}}});
 try{for(const file of files){const key='/'+file.slice(0,-6),hash=crypto.createHash('sha256').update(key).digest('hex'),body=fs.readFileSync(path.join(cacheRoot,build,file));const r=await fetch(new URL('/populate',await writer.url),{method:'POST',headers:{'content-length':String(body.length),'x-opennext-cache-key':`system/opennext-cache/${build}/${hash}.cache`},body});assert.equal(r.status,200,await r.text());}}finally{await writer.dispose();}
 const worker=await unstable_startWorker({...common,name:'hskkit',config:path.join(S,'wrangler.jsonc'),entrypoint:path.join(T,'bundle/worker.cache-probe.js'),build:{bundle:false},assets:path.join(root,'assets')});
 const checks=[];
 try{
  for(const file of files){const route='/'+file.slice(0,-6);const r=await worker.fetch('http://localhost'+route),body=await r.text();assert.equal(r.status,200,route);assert.equal(r.headers.get('x-local-next-dispatched'),'0',route);assert.ok(body.includes('HSKKit'));checks.push({route,status:200,nextServerDispatch:0});}
  for(const route of ['/formal-media/course-chinese-1-b-v1/index.coursedoc','/%66ormal-media/course-chinese-1-b-v1/index.coursedoc','/api/v1/course-tests/chinese-1/b/file/paper-data.json','/api/v1/course-tests/chinese-1/c/file/teacher.pdf']){const expected=route.startsWith('/api/')?401:404,r=await worker.fetch('http://localhost'+route);assert.equal(r.status,expected,route);await r.body?.cancel();checks.push({route,status:expected});}
  for(const query of ['?x=1','?_rsc=fixture']){const r=await worker.fetch('http://localhost/chinese-course-tests'+query);assert.equal(r.status,200);await r.body?.cancel();}
  const flight=await worker.fetch('http://localhost/chinese-course-tests?_rsc=fixture',{headers:{rsc:'1','next-router-prefetch':'1'}});assert.equal(flight.status,200);assert.ok(flight.headers.get('content-type')?.includes('text/x-component'));await flight.body?.cancel();
  const anon=await worker.fetch('http://localhost/api/v1/account');assert.equal(anon.headers.get('x-local-next-dispatched'),'0');assert.equal(anon.headers.get('cache-control'),'private, no-store');assert.equal((await anon.json()).account,null);
  const reward=await worker.fetch('http://localhost/api/v1/account/learning-rewards',{method:'POST',body:'invalid-json'});assert.equal(reward.status,401);assert.equal(reward.headers.get('x-local-next-dispatched'),'0');await reward.body?.cancel();
  const cookie=await worker.fetch('http://localhost/api/v1/account',{headers:{cookie:'consent=fixture'}});assert.equal(cookie.status,200);assert.equal(cookie.headers.get('x-local-next-dispatched'),'1');await cookie.body?.cancel();
 }finally{await worker.dispose();}
 console.log(JSON.stringify({environment:'local workerd',checks,queryChecks:2,flightResponse:true,statelessAccountChecks:3,productionProbeHeaders:false}));
})().catch(error=>{console.error(error);process.exitCode=1});
