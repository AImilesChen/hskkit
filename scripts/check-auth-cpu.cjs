// Local diagnostic: the real OAuth entry and application imports; only platform
// bindings are fixtures. CPU figures are Node CPU, not production Worker CPU.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const { build } = require('esbuild');
const root = path.resolve(__dirname, '..');
async function main() {
  const label = process.argv[2] || 'current';
  const output = path.resolve(process.argv[3] || path.join(os.tmpdir(), 'hskkit-auth-cpu'));
  fs.mkdirSync(output, { recursive: true });
  const bundle = path.join(output, `${label}.cjs`);
  const result = await build({ absWorkingDir: root, entryPoints: ['src/app/api/v1/auth/google/start/route.ts'], bundle: true, write: false, metafile: true, platform: 'node', format: 'cjs', packages: 'external', plugins: [{ name: 'local-platform', setup(builder) {
    builder.onResolve({ filter: /^(next\/headers|@opennextjs\/cloudflare|react)$/ }, args => ({ path: args.path, namespace: 'fixture' }));
    builder.onResolve({ filter: /^next\/server$/ }, () => ({ path: require.resolve('next/server.js'), external: true }));
    builder.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ contents: args.path === 'next/headers' ? `export const cookies=async()=>({get:name=>{const v=globalThis.__authCpu.jar.get(name);return v?{value:v}:undefined;}});` : args.path === 'react' ? `export const cache=fn=>fn;` : `export const getCloudflareContext=()=>({env:globalThis.__authCpu.env});`, loader: 'js' }));
  } }], logLevel: 'silent' });
  fs.writeFileSync(bundle, result.outputFiles[0].contents);
  const included = Object.entries(Object.values(result.metafile.outputs)[0].inputs).filter(([,v]) => v.bytesInOutput > 0).map(([file,v]) => ({ file, bytes: v.bytesInOutput }));
  const runner = path.join(output, 'runner.cjs');
  fs.writeFileSync(runner, `const fs=require('node:fs');
globalThis.__authCpu={jar:new Map(),env:{GOOGLE_CLIENT_ID:'local-client',GOOGLE_CLIENT_SECRET:'local-secret',GOOGLE_REDIRECT_URI:'https://hskkit.test/api/v1/auth/google/callback'}};
(async()=>{const before=process.cpuUsage();const route=require(process.argv[2]);const r=await route.GET(new Request('https://hskkit.test/api/v1/auth/google/start?returnTo=v1.L3RvZGF5'));const cold=process.cpuUsage(before);if(r.status!==307||!r.headers.get('location').startsWith('https://accounts.google.com/'))throw Error('OAuth response changed');const start=process.cpuUsage();for(let i=0;i<300;i++)await route.GET(new Request('https://hskkit.test/api/v1/auth/google/start?returnTo=v1.L3RvZGF5'));const warm=process.cpuUsage(start);console.log(JSON.stringify({coldCpuMs:(cold.user+cold.system)/1000,warmMeanCpuMs:(warm.user+warm.system)/300000,status:r.status}));})().catch(e=>{console.error(e.message);process.exitCode=1;});`);
  const samples = [];
  for (let i=0; i<9; i++) { const r=spawnSync(process.execPath,[runner,bundle],{encoding:'utf8',timeout:30000}); if(r.status!==0)throw Error(r.stderr); samples.push(JSON.parse(r.stdout)); }
  const median = key => samples.map(v=>v[key]).sort((a,b)=>a-b)[Math.floor(samples.length/2)];
  const report = { environment: 'local Node, platform fixtures; not production Worker CPU', label, bundleBytes: result.outputFiles[0].contents.length, applicationModules: included.filter(v=>v.file.startsWith('src/')).length, includesPracticeInitialization: included.some(v=>v.file==='src/lib/practice/questions.ts'), coldMedianCpuMs: median('coldCpuMs'), warmMeanMedianCpuMs: median('warmMeanCpuMs'), samples, included };
  fs.writeFileSync(path.join(output, `${label}.json`), JSON.stringify(report,null,2));
  console.log(JSON.stringify({...report, included: undefined, samples: undefined}));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
