const test = require('node:test'), assert = require('node:assert/strict'), http = require('node:http');
const localHttp = require('../scripts/local-worker-http.cjs');
test('early POST rejection does not stall the following cookie GET; redirects and response bytes survive', async () => {
  const sockets = new Set();
  const server = http.createServer((req, res) => {
    sockets.add(req.socket);
    if (req.method === 'POST') { res.writeHead(401); res.end('unauthorized'); return; }
    if (req.url === '/redirect') { res.writeHead(307, { location: '/cookie' }); res.end(); return; }
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'private, no-store' });
    res.end(JSON.stringify({ cookie: req.headers.cookie || null }));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const post = await localHttp(base, { method: 'POST', body: 'invalid-json' });
    assert.equal(post.status, 401); assert.equal(await post.text(), 'unauthorized');
    const cookie = await localHttp(base + '/redirect', { headers: { cookie: 'consent=fixture' } });
    assert.equal(cookie.status, 200); assert.equal(cookie.headers.get('cache-control'), 'private, no-store');
    assert.deepEqual(await cookie.json(), { cookie: 'consent=fixture' });
    assert.equal(sockets.size, 3);
    await assert.rejects(localHttp('http://example.com', {}, base), /isolated HTTP listener/);
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});
