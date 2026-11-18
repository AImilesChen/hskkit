const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process'),ts=require('typescript');
const base='eafffd55105111ac24715cedb8c9f02be14199f0';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:4*1024*1024});
const allowed=new Set(['src/lib/blog/repository.ts','src/lib/blog/public-guide-summaries.ts','src/lib/dictionary/character-prebuild-slugs.json',
 'src/lib/runtime/anonymous-account.ts','src/lib/runtime/public-word-cache.ts','src/app/character/[hanzi]/page.tsx','src/app/learn/page.tsx']);
const changed=git('diff','--name-only',base,'HEAD','--','src').trim().split('\n').filter(Boolean);
for(const file of changed)assert.ok(allowed.has(file),'Unexpected page, style or learning-code change: '+file);
git('diff','--exit-code',base,'HEAD','--','public','content','package.json','package-lock.json','next.config.ts','open-next.config.ts','wrangler.jsonc');
const source=(file,original=false)=>ts.createSourceFile(file,(original?git('show',base+':'+file):fs.readFileSync(file,'utf8')).replaceAll('\r\n','\n'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const fn=(ast,name)=>ast.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text===name);
const character='src/app/character/[hanzi]/page.tsx',learn='src/app/learn/page.tsx';
for(const name of ['clean','generateMetadata','CharacterLinks','CharacterPage'])assert.equal(fn(source(character),name).getText(),fn(source(character,true),name).getText(),name+' changed');
const returns=ast=>fn(ast,'LearningGuidesPage').body.statements.filter(ts.isReturnStatement).map(node=>node.getText());
const constants=ast=>ast.statements.filter(ts.isVariableStatement).map(node=>node.getText());
assert.deepEqual(returns(source(learn)),returns(source(learn,true)),'Guide JSX changed');
assert.deepEqual(constants(source(learn)),constants(source(learn,true)),'Guide metadata or copy changed');
const report={base,changed,characterRendererAndMetadataUnchanged:true,guideJsxAndCopyUnchanged:true,otherPageStylesFontsAndLearningCodeUnchanged:true,dependenciesAndDeploymentConfigurationUnchanged:true};
fs.mkdirSync('.open-next',{recursive:true});fs.writeFileSync('.open-next/remaining-cpu-ui.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
