const test=require('node:test'),assert=require('node:assert/strict');
const {validateObject,deleteBatch,M}=require('../scripts/clean-reviewed-cache.cjs');
const key=n=>`system/opennext-cache/${M.candidates[0].build}/${String(n).repeat(64)}.cache`;
const object=n=>({Key:key(n),Size:20+n,LastModified:new Date(Date.now()-5*86400000)});
test('only reviewed old hashes qualify; production, rollback, media and unreviewed prefixes are rejected',()=>{
 assert.equal(validateObject(object(1)).Key,key(1));
 for(const build of M.protectedBuilds)assert.throws(()=>validateObject({...object(1),Key:`system/opennext-cache/${build}/${'a'.repeat(64)}.cache`}));
 for(const bad of ['system/artifacts/product.zip','private/learning.json','system/opennext-cache/unreviewed-build-12345/'+ 'a'.repeat(64)+'.cache',key(1).replace('.cache','.css'),key(1)+'/extra'])assert.throws(()=>validateObject({...object(1),Key:bad}));
});
test('recent or unprovably aged cache entries cannot be deleted',()=>{
 for(const age of [new Date(),undefined,'invalid-date'])assert.throws(()=>validateObject({...object(1),LastModified:age}));
});
test('a production identity change stops before any S3 delete request',async()=>{
 let sends=0;await assert.rejects(deleteBatch({send:async()=>{sends++;}},[object(1)],async()=>{throw Error('changed');}),/changed/);assert.equal(sends,0);
});
test('duplicate keys and oversized batches are rejected before requests',async()=>{
 const client={send:async()=>{throw Error('must not send');}};
 await assert.rejects(deleteBatch(client,[object(1),object(1)],async()=>{}),/Duplicate/);
 await assert.rejects(deleteBatch(client,Array.from({length:501},()=>object(1)),async()=>{}),/batch size/);
});
test('a successful batch deletes only explicit approved keys and accounts exact bytes',async()=>{
 const batch=[object(1),object(2)];let result,guarded=false;
 const count=await deleteBatch({send:async command=>{assert.equal(guarded,true);assert.equal(command.input.Bucket,'hskkit-page-cache');assert.deepEqual(command.input.Delete,{Objects:batch.map(o=>({Key:o.Key})),Quiet:false});return {Deleted:batch.map(o=>({Key:o.Key}))};}},batch,async()=>{guarded=true;},r=>result=r);
 assert.equal(count,2);assert.equal(result.confirmedBytes,43);assert.equal(result.confirmedObjects,2);
});
test('partial Cloudflare errors record confirmed deletions and stop the run',async()=>{
 let result;await assert.rejects(deleteBatch({send:async()=>({Deleted:[{Key:key(1)}],Errors:[{Key:key(2),Code:'AccessDenied'}]})},[object(1),object(2)],async()=>{},r=>result=r),/partial deletion/);
 assert.equal(result.confirmedObjects,1);assert.equal(result.confirmedBytes,21);assert.equal(result.errors.length,1);
});
test('unconfirmed or unrelated response keys never produce a successful batch',async()=>{
 await assert.rejects(deleteBatch({send:async()=>({Deleted:[]})},[object(1)],async()=>{}),/confirm/);
 await assert.rejects(deleteBatch({send:async()=>({Deleted:[{Key:'private/unrelated'}]})},[object(1)],async()=>{}),/Unknown response/);
});
test('installed SDK serializes the exact reviewed XML delete request and reads confirmations',async t=>{
 const http=require('node:http'),{S3Client}=require('@aws-sdk/client-s3');let body='',method='',url='';
 const server=http.createServer(async(req,res)=>{method=req.method;url=req.url;for await(const chunk of req)body+=chunk;
  res.writeHead(200,{'content-type':'application/xml'});res.end(`<DeleteResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><Deleted><Key>${key(1)}</Key></Deleted></DeleteResult>`);
 });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const client=new S3Client({region:'auto',endpoint:`http://127.0.0.1:${server.address().port}`,forcePathStyle:true,credentials:{accessKeyId:'test',secretAccessKey:'test'},maxAttempts:1,requestChecksumCalculation:'WHEN_REQUIRED'});
 t.after(async()=>{client.destroy();await new Promise(resolve=>server.close(resolve));});
 assert.equal(await deleteBatch(client,[object(1)],async()=>{}),1);assert.equal(method,'POST');assert.ok(url.startsWith('/hskkit-page-cache/'));assert.ok(url.includes('delete'));assert.ok(body.includes(`<Key>${key(1)}</Key>`));assert.equal((body.match(/<Key>/g)||[]).length,1);
});
