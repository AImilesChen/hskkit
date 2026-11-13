const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const scripts=__dirname;
let source=fs.readFileSync(path.join(scripts,'check-public-cache-hit.cjs'),'utf8');
source=source.replace("logLevel:'error'","logLevel:'info'");
source=source.replace("const probe=path.join(root,'worker.cache-probe.js');", "const instrumented=src.replace('const { handler } = await import(\"./server-functions/default/handler.mjs\");', 'console.log(\"DIAG before Next import\",request.url); const { handler } = await import(\"./server-functions/default/handler.mjs\"); console.log(\"DIAG after Next import\",request.url);'); const probe=path.join(root,'worker.cache-probe.js');");
source=source.replace("fs.writeFileSync(probe,src.replace(", "fs.writeFileSync(probe,instrumented.replace(");
source=source.replace("const result=await handler(reqOrResp, env, ctx, request.signal);", 'console.log("DIAG before Next handler"); const result=await handler(reqOrResp, env, ctx, request.signal); console.log("DIAG after Next handler");');
const cookie="const earlyCookie=await checkedFetch(worker,'http://localhost/api/v1/account',{headers:{cookie:'consent=fixture'}});assert.equal(earlyCookie.status,200);assert.equal(earlyCookie.headers.get('x-local-next-dispatched'),'1');assert.equal((await earlyCookie.json()).account,null);";
const variants={original:source,cookieFirst:source.replace("  for(const file of files){const route", cookie+String.fromCharCode(10)+"  for(const file of files){const route")};
for(const [name,code] of Object.entries(variants)){
 const file=path.join(scripts,'.diagnose-'+name+'.cjs');
 fs.writeFileSync(file,code);
 console.log('DIAG VARIANT',name,'contains early check',code.includes('const earlyCookie='));
 const r=spawnSync(process.execPath,[file],{cwd:path.join(scripts,'..'),encoding:'utf8',timeout:400000});
 process.stdout.write(r.stdout||'');process.stderr.write(r.stderr||'');
 console.log('DIAG RESULT',name,r.status,r.error?.code||'');
}
