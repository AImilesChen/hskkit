// Local verification transport. Each request owns a fresh TCP connection so an
// early POST rejection cannot hold the fetch pool ahead of the next assertion.
const http = require('node:http');
module.exports = async function localWorkerHttp(url, init = {}, origin = new URL(url).origin, redirects = 0) {
  const target = new URL(url);
  if (target.protocol !== 'http:' || target.origin !== origin)
    throw new Error('Local verification left its isolated HTTP listener');
  const headers = new Headers(init.headers);
  headers.set('connection', 'close');
  if (init.body != null) headers.set('content-length', String(Buffer.byteLength(init.body)));
  const result = await new Promise((resolve, reject) => {
    const request = http.request(target, { method: init.method || 'GET', headers: Object.fromEntries(headers), agent: false }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('error', reject);
      response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, body: Buffer.concat(chunks) }));
    });
    request.setTimeout(30000, () => request.destroy(new Error('Local HTTP verification timed out')));
    request.on('error', reject);
    request.end(init.body);
  });
  if ([301, 302, 303, 307, 308].includes(result.status) && result.headers.location) {
    if (redirects >= 5) throw new Error('Too many local verification redirects');
    const next = new URL(result.headers.location, target);
    const nextInit = result.status === 303 || ([301, 302].includes(result.status) && init.method === 'POST')
      ? { ...init, method: 'GET', body: undefined } : init;
    return module.exports(next, nextInit, origin, redirects + 1);
  }
  const responseHeaders = new Headers();
  for (const [key, value] of Object.entries(result.headers))
    for (const part of Array.isArray(value) ? value : [value]) if (part !== undefined) responseHeaders.append(key, part);
  return new Response([204, 205, 304].includes(result.status) ? null : result.body, { status: result.status, headers: responseHeaders });
};
