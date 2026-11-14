// Local release verification only. Do not share pooled connections across probes
// of workerd's cached responses, RSC streams and lazily loaded Next handlers.
const http = require('node:http');

function localOrigin(url) {
  if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) {
    throw new Error('Local Worker verification requires an isolated HTTP listener');
  }
  return url.origin;
}

async function fetchLocalWorker(input, init = {}, timeoutMs = 30000) {
  const initial = new URL(input);
  const origin = localOrigin(initial);
  const deadline = Date.now() + timeoutMs;
  let current = initial;
  for (let redirects = 0; redirects <= 5; redirects++) {
    if (localOrigin(current) !== origin) throw new Error('Local verification left its isolated HTTP listener');
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new Error('Local Worker HTTP request timed out');
    const response = await new Promise((resolve, reject) => {
      const headers = Object.fromEntries(new Headers(init.headers));
      headers.connection = 'close';
      const request = http.request(current, { method: init.method || 'GET', headers, agent: false }, incoming => {
        const chunks = [];
        incoming.on('data', chunk => chunks.push(chunk));
        incoming.on('aborted', () => reject(new Error('Local Worker response was aborted')));
        incoming.on('error', reject);
        incoming.on('end', () => {
          const resultHeaders = new Headers();
          for (const [key, value] of Object.entries(incoming.headers)) {
            if (Array.isArray(value)) value.forEach(item => resultHeaders.append(key, item));
            else if (value !== undefined) resultHeaders.set(key, value);
          }
          const status = incoming.statusCode;
          const body = [204, 205, 304].includes(status) ? null : Buffer.concat(chunks);
          const result = new Response(body, { status, headers: resultHeaders });
          Object.defineProperty(result, 'url', { value: current.href });
          resolve(result);
        });
      });
      const timer = setTimeout(() => request.destroy(new Error('Local Worker HTTP request timed out')), remaining);
      request.on('close', () => clearTimeout(timer));
      request.on('error', reject);
      request.end(init.body);
    });
    if (![301, 302, 303, 307, 308].includes(response.status) || !response.headers.get('location')) return response;
    if (redirects === 5) throw new Error('Too many local Worker redirects');
    current = new URL(response.headers.get('location'), current);
  }
}

module.exports = { fetchLocalWorker };
