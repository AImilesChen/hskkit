const {test}=require('node:test'),assert=require('node:assert/strict');
const {identity,selection,remove,releaseMatches}=require('./cache-maintenance.cjs');
const builds=['a'.repeat(21),'b'.repeat(21),'c'.repeat(21),'d'.repeat(21)],versions=['v1','v2','v3','v4'],entries=Object.fromEntries(versions.map((v,i)=>[v,builds[i]])),deployments=versions.map((v,i)=>({id:'d'+i,versions:[{version_id:v,percentage:100}]}));
const object=(build,key='a'.repeat(64),ext='cache')=>({Key:`system/opennext-cache/${build}/${key}.${ext}`,Size:100,LastModified:new Date(0)});
test('current release and two previous distinct releases are protected',()=>{const s=identity([deployments[0],...deployments],entries,builds[0]);assert.deepEqual(s.protectedBuilds,builds.slice(0,3));const r=selection(builds.map(b=>object(b)),entries,s.protectedBuilds);assert.deepEqual(r.selected,[object(builds[3])]);});
test('unknown releases and unrelated object paths never become candidates',()=>{const objects=[object('z'.repeat(21)),{...object(builds[3]),Key:'fonts/font.woff2'},{...object(builds[3]),Key:`system/opennext-cache/${builds[3]}/../private`},object(builds[3],'bad')];assert.equal(selection(objects,entries,builds.slice(0,3)).selected.length,0);});
test('missing release mappings, mismatched live builds and split rollouts stop selection',()=>{assert.throws(()=>identity(deployments,{v1:builds[0]},builds[0]));assert.throws(()=>identity(deployments,entries,builds[1]));assert.throws(()=>identity([{...deployments[0],versions:[{version_id:'v1',percentage:90},{version_id:'v2',percentage:10}]},...deployments.slice(1)],entries,builds[0]));});
test('production change blocks deletion before transport',async()=>{let calls=0;await assert.rejects(remove({send:async()=>{calls++;}},[object(builds[3])],async()=>{throw Error('production changed');},()=>{}));assert.equal(calls,0);});
test('partial deletion stops and counts only confirmed objects',async()=>{let count;const a=object(builds[3]),b=object(builds[3],'b'.repeat(64));await assert.rejects(remove({send:async()=>({Deleted:[{Key:a.Key}],Errors:[{Key:b.Key,Code:'Denied'}]})},[a,b],async()=>{},r=>count=r));assert.deepEqual(count,{objects:1,bytes:100});});
test('successful bounded deletion reports exact bytes and uses only the cache bucket',async()=>{const a=object(builds[3]);let bucket;await remove({send:async c=>{bucket=c.input.Bucket;return {Deleted:[{Key:a.Key}]};}},[a],async()=>{},r=>assert.deepEqual(r,{objects:1,bytes:100}));assert.equal(bucket,'hskkit-page-cache');});
test('oversize deletion batch is refused',async()=>{await assert.rejects(remove({send:async()=>assert.fail()},Array(501).fill(object(builds[3])),async()=>{},()=>{}));});
test('post-release cleanup requires the verified live release to match the successful source',()=>{
 const baseline={version:'v1',build:builds[0]},record={...baseline,source:'a'.repeat(40)};
 assert.equal(releaseMatches(baseline,record,'a'.repeat(40)),true);
 assert.equal(releaseMatches(baseline,record,'b'.repeat(40)),false);
 assert.equal(releaseMatches(baseline,null,''),true);
});
test('missing or conflicting provenance cannot authorize post-release deletion',()=>{
 const baseline={version:'v1',build:builds[0]},record={...baseline,source:'a'.repeat(40)};
 for(const change of [{source:undefined},{version:'v2'},{build:builds[1]}]){
  assert.throws(()=>releaseMatches(baseline,{...record,...change},'a'.repeat(40)));
 }
 assert.throws(()=>releaseMatches(baseline,record,'bad'));
});

