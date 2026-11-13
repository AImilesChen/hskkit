const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {wordCacheFiles,publishEntries}=require('../scripts/publish-word-cache.cjs');
const {credentials,putCache,getCache}=require('../scripts/word-cache-r2.cjs');
function fixture(t){const root=fs.mkdtempSync(path.join(os.tmpdir(),'hsk-word-cache-'));
  t.after(()=>{const target=fs.realpathSync(root);assert.equal(path.dirname(target),fs.realpathSync(os.tmpdir()));fs.rmSync(target,{recursive:true,force:true});});
  const dir=path.join(root,'.open-next/cache/buildversion123/word/hsk2025.word.l1.0007.v1');fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'practice.cache'),'practice');fs.writeFileSync(path.dirname(dir)+'/hsk2025.word.l1.0007.v1.cache','word');
  fs.writeFileSync(path.join(root,'.open-next/cache/buildversion123/account.cache'),'private outside batch');return root;
}
test('publisher selects only this builds word caches and preserves original bytes',async t=>{
  const entries=wordCacheFiles(fixture(t),'buildversion123');assert.equal(entries.length,2);
  const stored=new Map();assert.equal(await publishEntries(entries,async(k,b)=>stored.set(k,Buffer.from(b)),2),2);
  for(const e of entries)assert.deepEqual(stored.get(e.key),fs.readFileSync(e.file));
});
test('failed writes stop scheduling and cannot report publication success',async t=>{
  const entries=wordCacheFiles(fixture(t),'buildversion123');let attempts=0;
  await assert.rejects(publishEntries(entries,async()=>{attempts++;throw Error('denied');},1),/denied/);assert.equal(attempts,1);
});
test('S3 credential derivation rejects missing token and malformed identity',()=>{
  assert.throws(()=>credentials('', 'a'.repeat(32)));assert.throws(()=>credentials('test-token-value-that-is-not-a-real-secret','../wrong'));
  const c=credentials('test-token-value-that-is-not-a-real-secret','a'.repeat(32));assert.equal(c.accessKeyId,'a'.repeat(32));assert.match(c.secretAccessKey,/^[a-f0-9]{64}$/);
});
test('cache client refuses keys outside the versioned page-cache namespace',async()=>{
  const client={send:()=>{throw Error('must not send');}};
  await assert.rejects(putCache(client,'private/user-record',Buffer.from('x')));
  await assert.rejects(getCache(client,'system/other/object'));
});
test('installed S3 SDK signs requests and round-trips byte-identical JSON using only the fixed cache bucket',async t=>{
  const http=require('node:http'),{S3Client}=require('@aws-sdk/client-s3');const objects=new Map();let signed=true,scoped=true;
  const server=http.createServer(async(req,res)=>{
    signed=signed&&String(req.headers.authorization).startsWith('AWS4-HMAC-SHA256 ');
    scoped=scoped&&req.url.startsWith('/hskkit-page-cache/system/opennext-cache/');
    if(req.method==='PUT'){const chunks=[];for await(const c of req)chunks.push(c);objects.set(req.url.split('?')[0],Buffer.concat(chunks));res.end();}
    else {const bytes=objects.get(req.url.split('?')[0]);res.writeHead(bytes?200:404,{'content-type':'application/json'});res.end(bytes);}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const client=new S3Client({region:'auto',endpoint:`http://127.0.0.1:${server.address().port}`,forcePathStyle:true,
    credentials:credentials('test-token-value-that-is-not-a-real-secret','a'.repeat(32)),maxAttempts:1,requestChecksumCalculation:'WHEN_REQUIRED',responseChecksumValidation:'WHEN_REQUIRED'});
  t.after(async()=>{client.destroy();await new Promise(resolve=>server.close(resolve));});
  const key='system/opennext-cache/buildversion123/'+'a'.repeat(64)+'.cache',bytes=Buffer.from('{"html":"半 bàn"}');
  await putCache(client,key,bytes);assert.deepEqual(await getCache(client,key),bytes);assert.equal(signed,true);assert.equal(scoped,true);
});
