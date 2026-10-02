import {selectPackAssets} from '../src/lib/commercial/catalog.ts';
import {buildWorksheetLevel} from '../src/lib/commercial/worksheet-pack.ts';

// Read-only editorial inventory; never treats regex findings as a release GO.
const rows = ['id\tlevel\tmodule\tflags\tprompt\tanswer\texplanation\tcommonError\tsampleResponse'];
const totals = new Map<string,number>();
for (let level=1;level<=9;level++) {
  const plan=buildWorksheetLevel(selectPackAssets(level));
  for(const module of plan.modules)for(const question of module.questions){
    const flags:string[]=[];
    if(/means [“"].*?[”"]|表示[“"].*?[”"]|词典.*界定为[“"]|它表示[“"]/u.test(question.prompt))flags.push('DEFINITION_IN_STIMULUS');
    if(question.prompt.includes('[source setting]')||question.prompt.includes('[evidence]'))flags.push('PLACEHOLDER');
    if(module.kind==='review-test'&&/先查到|词典.*界定|并说明它表示|定义和试读|表示[“"]/u.test(question.prompt))flags.push('RETEST_CUE');
    if(level>=7&&/词典|means [“"]|表示[“"]/.test(question.prompt))flags.push('ADVANCED_DICTIONARY_PSEUDO_SOURCE');
    if(/把.*表示.*所以选了|查到.*表示.*写进/.test(question.prompt))flags.push('ANSWER_EXPLICIT');
    // These are candidate findings, not proof that a question is sound if no flag fires.
    for(const flag of flags)totals.set(flag,(totals.get(flag)??0)+1);
    rows.push([question.id,level,module.kind,flags.join('|')||'EDITORIAL_REVIEW_REQUIRED',question.prompt,question.answer,question.explanation,question.commonError,question.sampleResponse].map(value=>String(value).replaceAll('\t',' ').replaceAll('\n',' ')).join('\t'));
  }
}
if(process.argv.includes('--tsv'))process.stdout.write(rows.join('\n')+'\n');
else process.stdout.write(JSON.stringify({items:rows.length-1,flags:Object.fromEntries(totals),unflaggedButUnreviewed:rows.filter(row=>row.includes('EDITORIAL_REVIEW_REQUIRED')).length},null,2)+'\n');
