const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const {S3Client,PutObjectCommand,GetObjectCommand}=require('@aws-sdk/client-s3');
const ACCOUNT='77bc392d46985cd3425691358f5e8a77',BUCKET='hskkit-page-cache';
function credentials(token,id){
  assert.ok(typeof token==='string'&&token.length>20,'Missing deployment credential');
  assert.match(id,/^[a-f0-9]{32}$/,'Invalid account token identity');
  return {accessKeyId:id,secretAccessKey:crypto.createHash('sha256').update(token).digest('hex')};
}
async function createCacheClient(){
  const token=process.env.CLOUDFLARE_API_TOKEN;
  assert.equal(process.env.CLOUDFLARE_ACCOUNT_ID,ACCOUNT,'Unexpected account');
  assert.ok(token,'Missing deployment credential');
  const response=await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/tokens/verify`,{
    headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(20000)});
  assert.ok(response.ok,'Cannot verify deployment account token');
  const value=await response.json();
  assert.equal(value.success,true,'Account token verification failed');
  assert.equal(value.result.status,'active','Account token is not active');
  return new S3Client({region:'auto',endpoint:`https://${ACCOUNT}.r2.cloudflarestorage.com`,
    credentials:credentials(token,value.result.id),maxAttempts:2,
    requestChecksumCalculation:'WHEN_REQUIRED',responseChecksumValidation:'WHEN_REQUIRED'});
}
async function putCache(client,key,bytes){
  assert.match(key,/^system\/opennext-cache\/[A-Za-z0-9_-]{10,64}\/[a-f0-9]{64}\.cache$/);
  await client.send(new PutObjectCommand({Bucket:BUCKET,Key:key,Body:bytes,ContentType:'application/json'}),{abortSignal:AbortSignal.timeout(60000)});
}
async function getCache(client,key){
  assert.match(key,/^system\/opennext-cache\/[A-Za-z0-9_-]{10,64}\/[a-f0-9]{64}\.cache$/);
  const result=await client.send(new GetObjectCommand({Bucket:BUCKET,Key:key}),{abortSignal:AbortSignal.timeout(60000)});
  return Buffer.from(await result.Body.transformToByteArray());
}
module.exports={credentials,createCacheClient,putCache,getCache};
if(require.main===module)(async()=>{
  const timer=setTimeout(()=>{console.error('Cache transport preflight timed out');process.exit(1);},90000);timer.unref();
  const client=await createCacheClient();
  try{
    const build='preflight-'+process.env.GITHUB_RUN_ID;
    const key=`system/opennext-cache/${build}/${crypto.createHash('sha256').update('transport').digest('hex')}.cache`;
    const bytes=Buffer.from('{"purpose":"word cache transport preflight"}');
    await putCache(client,key,bytes);assert.deepEqual(await getCache(client,key),bytes);
    console.log('Scoped cache-bucket S3 write/read preflight passed');
  }finally{client.destroy();clearTimeout(timer);}
})().catch(error=>{console.error(`Cache transport failed: ${error.name}`);process.exit(1);});
