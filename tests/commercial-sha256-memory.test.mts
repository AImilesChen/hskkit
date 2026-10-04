import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {sha256Hex} from '../src/lib/commercial/signer.ts';

test('commercial checksum hashes both exact R2 buffers and subarray views', async () => {
  const bytes = new TextEncoder().encode('prefix-payload-suffix');
  for (const source of [bytes, bytes.subarray(7, 14), 'payload']) {
    const expected = createHash('sha256').update(source).digest('hex');
    assert.equal(await sha256Hex(source), expected);
  }
});
