// Package a local-only preview of the exact validated Worker, without deploying.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),open=path.join(root,'.open-next');
const gate=fs.readdirSync(open).find(name=>name.startsWith('.cache-check-')&&fs.existsSync(path.join(open,name,'bundle/worker.cache-probe.js')));
assert.ok(gate,'Successful local gate bundle not found');
const target=path.join(open,'cpu-validation-preview');assert.ok(!fs.existsSync(target));fs.mkdirSync(target);
fs.cpSync(path.join(open,gate,'bundle'),path.join(target,'bundle'),{recursive:true});
fs.cpSync(path.join(open,gate,'assets'),path.join(target,'assets'),{recursive:true});
fs.cpSync(path.join(open,'assets/_next/static'),path.join(target,'assets/_next/static'),{recursive:true});
for(const name of ['favicon.ico','favicon.svg','favicon.png','icons','images','home','illustrations']){
 const source=path.join(open,'assets',name);if(fs.existsSync(source))fs.cpSync(source,path.join(target,'assets',name),{recursive:true});
}
const manifest=JSON.parse(fs.readFileSync('content/blog/manifest.json','utf8'));
const quote=value=>"'"+String(value).replaceAll("'","''")+"'";
let sql="CREATE TABLE blog_posts(id TEXT PRIMARY KEY,slug TEXT UNIQUE,status TEXT,published_at TEXT,updated_at TEXT,published_version_number INTEGER);\nCREATE TABLE blog_post_versions(post_id TEXT,version_number INTEGER,snapshot_json TEXT,PRIMARY KEY(post_id,version_number));\n";
for(const article of manifest.articles){
 const snapshot=JSON.stringify({slug:article.slug,title:article.title,excerpt:article.excerpt,contentMarkdown:''});
 sql+=`INSERT INTO blog_posts VALUES(${quote(article.id)},${quote(article.slug)},'published',${quote(article.publishedAt)},${quote(article.publishedAt)},1);\n`;
 sql+=`INSERT INTO blog_post_versions VALUES(${quote(article.id)},1,${quote(snapshot)});\n`;
}
fs.writeFileSync(path.join(target,'local-guide-fixture.sql'),sql);
fs.writeFileSync(path.join(target,'wrangler.json'),JSON.stringify({name:'hskkit-cpu-validation-local',main:'bundle/worker.cache-probe.js',minify:false,
 compatibility_date:'2026-05-24',compatibility_flags:['nodejs_compat','global_fetch_strictly_public'],
 assets:{directory:'assets',binding:'ASSETS',run_worker_first:['/formal-media/*']},vars:{NEXT_INC_CACHE_R2_PREFIX:'system/opennext-cache'},
 r2_buckets:[{binding:'NEXT_INC_CACHE_R2_BUCKET',bucket_name:'hskkit-local-preview-cache'}],
 d1_databases:[{binding:'LEARNING_DB',database_name:'hskkit-local-preview-guides',database_id:'a6376a2e-293d-40b1-a272-004e4af62cc7'}]},null,2));
fs.writeFileSync(path.join(target,'preview-scope.json'),JSON.stringify({localOnly:true,productionDeployed:false,source:process.env.GITHUB_SHA,
 worker:'Exact Linux-validated bundle with local-only dispatch probe headers',guideData:'Local public repository fixtures; not production D1',
 routes:['/character/学','/character/半','/character/爱','/character/餐','/word/hsk2025.word.l1.0102.v1','/learn']},null,2));
console.log(JSON.stringify({directory:target,localOnly:true,productionDeployed:false}));
