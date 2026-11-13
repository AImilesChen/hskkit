const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const scripts=__dirname,original=fs.readFileSync(path.join(scripts,'check-public-cache-hit.cjs'),'utf8');
for(const [name,level,big] of [['errorBig','error',true],['errorDefault','error',false],['infoDefault','info',false],['infoBig','info',true]]){
 const code=original.replace("logLevel:'error'","logLevel:'"+level+"'");
 const file=path.join(scripts,'.diagnose-'+name+'.cjs');fs.writeFileSync(file,code);
 const env={...process.env};if(big)env.NODE_OPTIONS='--max-old-space-size=6144';else delete env.NODE_OPTIONS;
 console.log('DIAG VARIANT',name,'level',level,'heap',big?'6144':'default');
 const r=spawnSync(process.execPath,[file],{cwd:path.join(scripts,'..'),encoding:'utf8',timeout:400000,env});
 process.stdout.write(r.stdout||'');process.stderr.write(r.stderr||'');console.log('DIAG RESULT',name,r.status,r.error?.code||'');
}
