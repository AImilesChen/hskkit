const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {wordCacheFiles,uploadWordCache}=require('../scripts/publish-word-cache.cjs');
function fixture(t) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'hsk-word-cache-'));
  t.after(()=>{const target=fs.realpathSync(root);assert.equal(path.dirname(target),fs.realpathSync(os.tmpdir()));fs.rmSync(target,{recursive:true,force:true});});
  const dir=path.join(root,'.open-next/cache/buildversion123/word/hsk2025.word.l1.0007.v1');fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'practice.cache'),'practice');fs.writeFileSync(path.dirname(dir)+'/hsk2025.word.l1.0007.v1.cache','word');
  fs.writeFileSync(path.join(root,'.open-next/cache/buildversion123/account.cache'),'outside word batch');return root;
}
test('bulk manifest selects only current-build word caches and preserves files',t=>{
  const root=fixture(t),manifest=path.join(root,'manifest.json');
  assert.equal(uploadWordCache(root,'buildversion123',2,manifest,(_exe,args,options)=>{
    assert.deepEqual(args.slice(1,5),['r2','bulk','put','hskkit-page-cache']);
    assert.ok(args.includes('--remote'));assert.ok(args.includes('--force'));assert.equal(options.timeout,720000);
    const entries=JSON.parse(fs.readFileSync(manifest,'utf8'));assert.equal(entries.length,2);
    assert.deepEqual(entries.map(e=>fs.readFileSync(e.file,'utf8')).sort(),['practice','word']);
    assert.ok(entries.every(e=>e.key.startsWith('system/opennext-cache/buildversion123/')));return {status:0};
  }),2);
});
test('missing cache files and upload failures prevent activation',t=>{
  const root=fixture(t),manifest=path.join(root,'manifest.json');let called=false;
  assert.throws(()=>uploadWordCache(root,'buildversion123',3,manifest,()=>{called=true;}),/Missing generated/);assert.equal(called,false);
  assert.throws(()=>uploadWordCache(root,'buildversion123',2,manifest,()=>({status:1})),/upload failed/);
  assert.throws(()=>uploadWordCache(root,'buildversion123',2,manifest,()=>({status:null,error:Error('timed out')})),/timed out/);
});
test('installed Wrangler accepts the bulk manifest and round-trips unchanged R2 bytes',{skip:process.platform==='win32'?'workerd integration requires Linux CI':false},t=>{
  const {spawnSync}=require('node:child_process');const root=fixture(t),config=path.join(root,'wrangler.json'),manifest=path.join(root,'manifest.json');
  fs.writeFileSync(config,JSON.stringify({name:'hsk-cache-test',compatibility_date:'2026-05-24'}));
  const entries=wordCacheFiles(root,'buildversion123');fs.writeFileSync(manifest,JSON.stringify(entries.map(({key,file})=>({key,file}))));
  const cli=path.resolve(__dirname,'../node_modules/wrangler/bin/wrangler.js');
  const run=args=>{const r=spawnSync(process.execPath,[cli,...args,'--config',config],{cwd:root,env:{...process.env,WRANGLER_SEND_METRICS:'false',WRANGLER_LOG_PATH:path.join(root,'logs')},encoding:'utf8',timeout:60000});assert.equal(r.status,0,r.stderr||r.error?.message);};
  run(['r2','bulk','put','hsk-cache-test','--filename',manifest,'--local','--force']);
  for(const [i,entry] of entries.entries()){const file=path.join(root,`readback-${i}`);run(['r2','object','get',`hsk-cache-test/${entry.key}`,'--file',file,'--local']);assert.deepEqual(fs.readFileSync(file),fs.readFileSync(entry.file));}
});
