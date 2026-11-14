const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { fetchLocalWorker } = require('../scripts/local-worker-http.cjs');

async function listener(t, handler) {
  const server = http.createServer(handler);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => { server.closeAllConnections(); return new Promise(resolve => server.close(resolve)); });
  return `http://127.0.0.1:${server.address().port}`;
}

test('each local probe uses a fresh socket and preserves complete bodies, cookies, Host and RSC headers', async t => {
  const sockets = new Set();
  const seen = [];
  const origin = await listener(t, (req, res) => {
    sockets.add(req.socket); seen.push(req.headers);
    assert.equal(req.headers.connection, 'close');
    if (req.url === '/flight') {
      res.writeHead(200, { 'content-type': 'text/x-component' });
      res.write('a'.repeat(200000)); setImmediate(() => res.end('end'));
    } else {
      res.writeHead(200, { 'content-type': 'application/json', 'x-local-next-dispatched': '1' });
      res.end(JSON.stringify({ account: null }));
    }
  });
  const flight = await fetchLocalWorker(origin + '/flight', { headers: { host: 'localhost', rsc: '1' } });
  assert.equal(flight.headers.get('content-type'), 'text/x-component');
  assert.equal((await flight.text()).length, 200003);
  const account = await fetchLocalWorker(origin + '/api/v1/account', { headers: { host: 'localhost', cookie: 'consent=fixture' } });
  assert.equal(account.url, origin + '/api/v1/account');
  assert.equal(account.headers.get('x-local-next-dispatched'), '1');
  assert.deepEqual(await account.json(), { account: null });
  assert.equal(sockets.size, 2);
  assert.equal(seen[0].rsc, '1'); assert.equal(seen[1].cookie, 'consent=fixture');
  assert.ok(seen.every(headers => headers.host === 'localhost'));
});

test('local redirects preserve the request and cannot leave the isolated listener', async t => {
  const origin = await listener(t, (req, res) => {
    if (req.url === '/local') { res.writeHead(307, { location: '/result' }); return res.end(); }
    if (req.url === '/external') { res.writeHead(302, { location: 'https://example.com/' }); return res.end(); }
    req.setEncoding('utf8'); let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => { res.writeHead(401, { 'content-type': 'application/json' }); res.end(JSON.stringify({ method: req.method, body })); });
  });
  const result = await fetchLocalWorker(origin + '/local', { method: 'POST', body: 'invalid-json' });
  assert.equal(result.status, 401);
  assert.deepEqual(await result.json(), { method: 'POST', body: 'invalid-json' });
  await assert.rejects(fetchLocalWorker(origin + '/external'), /isolated HTTP listener/);
});

test('a hung local response and invalid targets still fail verification', async t => {
  const origin = await listener(t, () => {});
  await assert.rejects(fetchLocalWorker(origin + '/hang', {}, 30), /timed out/);
  await assert.rejects(fetchLocalWorker('https://example.com/'), /isolated HTTP listener/);
});
