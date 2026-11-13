const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {cacheObjectKey,verifyBytes}=require('./verify-word-cache-upload.cjs');
const {createCacheClient,putCache,getCache}=require('./word-cache-r2.cjs');
function wordCacheFiles(root,build){
  const base=path.join(root,'.open-next/cache',build),files=[];
  function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const file=path.join(dir,entry.name);
    if(entry.isDirectory())walk(file);
    else if(entry.isFile()&&entry.name.endsWith('.cache')){
      const route='/'+path.relative(base,file).split(path.sep).join('/').slice(0,-6);
      files.push({file,route,key:cacheObjectKey(build,route),bytes:fs.statSync(file).size});
    }
  }}
  walk(path.join(base,'word'));return files.sort((a,b)=>a.route.localeCompare(b.route));
}
async function publishEntries(entries,put,concurrency=8,progress=()=>{}){
  let index=0,completed=0,failed=false;
  const tasks=Array.from({length:Math.min(concurrency,entries.length)},async()=>{
    for(;;){if(failed)return;const entry=entries[index++];if(!entry)return;
      try{await put(entry.key,fs.readFileSync(entry.file));}catch(error){failed=true;throw error;}
      progress(++completed,entries.length);
    }
  });
  const results=await Promise.allSettled(tasks);const failure=results.find(x=>x.status==='rejected');
  if(failure)throw failure.reason;return completed;
}
module.exports={wordCacheFiles,publishEntries};
if(require.main===module)(async()=>{
  const timer=setTimeout(()=>{console.error('Word cache upload exceeded ten minutes');process.exit(1);},600000);timer.unref();
  const root=path.resolve(__dirname,'..'),build=fs.readFileSync(path.join(root,'.next/BUILD_ID'),'utf8').trim();
  const selected=JSON.parse(fs.readFileSync(path.join(root,'src/lib/dictionary/word-prebuild-slugs.json'),'utf8'));
  const entries=wordCacheFiles(root,build);assert.equal(entries.length,selected.length*2,'Missing generated word cache');
  assert.ok(entries.length>0&&entries.length<=2538,'Word cache publication budget exceeded');
  const bytes=entries.reduce((sum,e)=>sum+e.bytes,0);assert.ok(bytes>0&&bytes<=600*1024*1024,'Cache storage budget exceeded');
  console.log(JSON.stringify({build,plannedObjects:entries.length,plannedBytes:bytes,bucket:'hskkit-page-cache'}));
  const client=await createCacheClient();
  try{
    const first=entries[0],value=fs.readFileSync(first.file);
    await putCache(client,first.key,value);verifyBytes(value,await getCache(client,first.key));
    const count=await publishEntries(entries,(key,value)=>putCache(client,key,value),8,(done,total)=>{
      if(done%100===0||done===total)console.log(`Word cache uploaded ${done}/${total}`);
    });
    console.log(JSON.stringify({build,uploaded:count,bytes,bucket:'hskkit-page-cache',transport:'bucket-scoped S3 API'}));
  }finally{client.destroy();clearTimeout(timer);}
})().catch(error=>{console.error(`Word cache upload failed: ${error.name}`);process.exit(1);});
