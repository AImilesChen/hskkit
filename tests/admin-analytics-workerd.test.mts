import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
import { build } from "esbuild";

// Run Request construction inside workerd: Node's Request accepts redirect:error
// and therefore cannot detect the production-only compatibility regression.
test("workerd accepts reporting requests and rejects redirects for every Google operation", async () => {
  const require = createRequire(import.meta.url);
  const { Miniflare } = createRequire(require.resolve("wrangler"))("miniflare");
  const script = await build({ stdin: { resolveDir: process.cwd(), sourcefile: "reporting-runtime-fixture.ts", contents: `
    import { exchangeReportingCode, REPORTING_SCOPES } from './src/lib/admin/analytics-connection.ts';
    import { googleReportingToken, collectSearchConsole, collectGa4 } from './src/lib/admin/analytics-providers.ts';
    const env = { GOOGLE_CLIENT_ID:'fixture-client', GOOGLE_CLIENT_SECRET:'fixture-secret', GOOGLE_REDIRECT_URI:'https://hskkit.com/api/v1/auth/google/callback', ADMIN_ANALYTICS_GOOGLE_REFRESH_TOKEN:'fixture-refresh' };
    export default { async fetch() {
      const results = [];
      let oldModeRejected = false;
      try { new Request('https://fixture.invalid/', {redirect:'error'}); } catch { oldModeRejected = true; }
      for (const status of [200, 301, 302, 303, 307, 308]) {
        for (const operation of ['exchange','refresh','gsc','ga4']) {
          let requests = 0;
          const fetcher = async (url, init) => {
            requests++;
            const request = new Request(url, init);
            if (request.redirect !== 'manual') throw new Error('FIXTURE_REDIRECT_POLICY');
            if (status !== 200) return new Response('private fixture body', {status, headers:{location:'https://untrusted.invalid/'}});
            return Response.json({refresh_token:'fixture-refresh',access_token:'fixture-access',scope:REPORTING_SCOPES.join(' '),rows:[]});
          };
          try {
            if (operation === 'exchange') await exchangeReportingCode(env,'fixture-code','v'.repeat(64),fetcher);
            else if (operation === 'refresh') await googleReportingToken(env,fetcher);
            else if (operation === 'gsc') await collectSearchConsole('sc-domain:fixture.invalid','fixture-access',7,new Date('2026-11-27T00:00:00Z'),fetcher);
            else await collectGa4('123','fixture-access',7,new Date('2026-11-27T00:00:00Z'),fetcher);
            results.push({status,operation,requests,success:true});
          } catch(error) { results.push({status,operation,requests,success:false,error:error.message}); }
        }
      }
      return Response.json({oldModeRejected,results});
    }};
  ` }, bundle: true, write: false, format: "esm", platform: "browser", target: "es2022" });
  const mf = new Miniflare({ modules: true, script: script.outputFiles[0].text, compatibilityDate: "2026-05-24" });
  try {
    const data = await (await mf.dispatchFetch("http://fixture/")).json() as {
      oldModeRejected: boolean;
      results: {status:number;operation:string;requests:number;success:boolean;error?:string}[];
    };
    assert.equal(data.oldModeRejected, true);
    assert.equal(data.results.length, 24);
    for (const result of data.results) {
      assert.equal(result.success, result.status === 200, JSON.stringify(result));
      assert.equal(result.requests, result.operation === "gsc" ? 5 : result.operation === "ga4" ? 6 : 1);
      if (result.status !== 200) assert.equal(result.error, result.operation === "exchange" ? "REPORT_ACCESS_DENIED" : "REPORT_PROVIDER_UNAVAILABLE");
    }
    assert.doesNotMatch(JSON.stringify(data), /fixture-secret|fixture-refresh|fixture-access|private fixture body|untrusted/);
  } finally { await mf.dispose(); }
});
