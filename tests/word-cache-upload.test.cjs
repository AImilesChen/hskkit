const test = require('node:test');
const assert = require('node:assert/strict');
const { cacheObjectKey, verifyBytes } = require('../scripts/verify-word-cache-upload.cjs');
test('cache namespace separates builds, paths and practice pages', () => {
  const route = '/word/hsk2025.word.l1.0007.v1';
  const key = cacheObjectKey('buildversion123', route);
  assert.match(key, /^system\/opennext-cache\/buildversion123\/[a-f0-9]{64}\.cache$/);
  assert.notEqual(key, cacheObjectKey('otherbuild12345', route));
  assert.notEqual(key, cacheObjectKey('buildversion123', route + '/practice'));
  assert.throws(() => cacheObjectKey('../invalid', route));
  assert.throws(() => cacheObjectKey('buildversion123', '/api/v1/account'));
});
test('verification rejects stale, corrupt and empty cache data', () => {
  const current = Buffer.from('{"type":"app","html":"current build"}');
  assert.doesNotThrow(() => verifyBytes(current, Buffer.from(current)));
  assert.throws(() => verifyBytes(current, Buffer.from('{"html":"old build"}')));
  assert.throws(() => verifyBytes(current, Buffer.alloc(0)));
  assert.throws(() => verifyBytes(Buffer.alloc(0), Buffer.alloc(0)));
});
