import assert from 'node:assert/strict';
import test from 'node:test';
import {verifyPrefix,approvedScope} from '../scripts/cleanup-r2-cache.mjs';
const build='a'.repeat(21),prefix=`system/opennext-cache/${build}/`;
const object={Key:prefix+'1'.repeat(64)+'.cache',Size:12,LastModified:new Date('2026-11-02T00:00:00Z'),ETag:'old'};
const expected={objects:1,bytes:12,earliest:'2026-11-02T00:00:00+00:00',latest:'2026-11-02T00:00:00+00:00'};
test('accepts exact old-cache metadata and blocks other prefixes, recent writes and changed contents',()=>{
  verifyPrefix([object],build,expected);
  for(const value of [{...object,Key:'system/artifacts/file.zip'},{...object,Size:13},{...object,LastModified:new Date('2026-11-05T00:00:00Z')},{...object,Key:prefix+'unrecognized'}]){
    assert.throws(()=>verifyPrefix([value],build,expected));
  }
  assert.throws(()=>verifyPrefix([object,object],build,{...expected,objects:2,bytes:24}));
});
test('rejects arbitrary or altered approval inventories before any remote operation',()=>{
  assert.throws(()=>approvedScope({bucket:'different'}));
  assert.throws(()=>approvedScope({bucket:'hskkit-commercial-exports',cachePrefix:'system/artifacts/'}));
});
