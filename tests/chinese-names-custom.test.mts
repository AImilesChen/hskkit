import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultNamePreferences as base,generateNames,learningName,matchesName,nameMatchReasons,parseSavedNames,preferenceError,type NamePreferences} from '../src/lib/names/domain.ts';
import {lookupEnglishName,suggestedMeanings} from '../src/lib/names/english-origins.ts';

test('single-character names respect the surname and fixed character without inventing three alternatives',()=>{
  const preferences:NamePreferences={...base,mode:'character',surname:'林',character:'宁',givenLength:'1'};
  const result=generateNames(preferences);
  assert.deepEqual(result.items.map(n=>n.hanzi),['林宁']);
  assert.equal(result.items[0].pinyin,'Lín Níng');
  assert.ok(nameMatchReasons(result.items[0],preferences)[0].includes('宁'));
  assert.equal(result.items[0].characters.length,2);
});
test('all fixed-character positions and lengths are hard constraints, including with a retained old choice',()=>{
  for(const givenLength of ['any','1','2'] as const)for(const position of ['any','first','second'] as const){
    const preferences:NamePreferences={...base,mode:'character',surname:'陈',character:'宁',givenLength,position};
    if(givenLength==='1'&&position==='second'){assert.throws(()=>generateNames(preferences),/only one position/);continue;}
    const result=generateNames(preferences,{keepIds:['lin-mingyuan']});
    assert.equal(result.retained,0);
    for(const name of result.items){assert.equal(name.surname,'陈');assert.ok(name.given.includes('宁'));if(givenLength!=='any')assert.equal([...name.given].length,Number(givenLength));if(position==='first')assert.equal([...name.given][0],'宁');if(position==='second')assert.equal([...name.given][1],'宁');}
  }
  for(const character of ['','学习','宁。','../','<script>','龘','😀','𠀀'])assert.throws(()=>generateNames({...base,mode:'character',character}),character);
  assert.equal(generateNames({...base,mode:'character',character:'宁',position:'first',givenLength:'2'}).items.length,0);
});
test('every style is directly selectable without a purpose gate',()=>{
  for(const theme of ['modern','poetic','classical','wuxia'] as const){
    const preferences:NamePreferences={...base,theme};const result=generateNames(preferences,{random:()=>.4});
    assert.equal(result.items.length,3);
    assert.ok(result.items.every(name=>name.styles.includes(theme)&&matchesName(name,preferences)));
  }
  assert.throws(()=>generateNames({...base,surname:'../'}),/surname/);
});
test('known and ambiguous origins require an explicit selected meaning; unknown names never acquire an invented etymology',()=>{
  assert.equal(lookupEnglishName('  SOPHIA ')[0].id,'sophia');
  assert.equal(lookupEnglishName('Félix')[0].id,'felix');
  assert.equal(lookupEnglishName('Alex').length,2);
  assert.equal(lookupEnglishName('Stella').length,2);
  assert.equal(lookupEnglishName('Rose').length,2);
  assert.deepEqual(lookupEnglishName('A name not recorded'),[]);
  const preferences:NamePreferences={...base,mode:'english',englishName:'Sophia',rootId:'sophia',meaningConfirmed:true};
  assert.equal(generateNames(preferences).items.length,3);
  assert.ok(generateNames(preferences).items.every(n=>n.traits.includes('wisdom')));
  assert.match(preferenceError({...preferences,meaningConfirmed:false})!,/Confirm/);
  assert.ok(preferenceError({...preferences,rootId:'irene'}));
  assert.ok(preferenceError({...preferences,englishName:'Unknown'}));
  assert.ok(preferenceError({...preferences,englishName:'Stella',rootId:'stella-greek'}));
  const manual:NamePreferences={...preferences,englishName:'Unknown',rootId:'',useManualMeaning:true,manualMeaning:'Protect people I care about',meaningId:'protection'};
  assert.equal(preferenceError(manual),undefined);
  assert.ok(generateNames(manual).items.every(n=>/[守佑]/.test(n.given)));
  assert.deepEqual(suggestedMeanings('protection and care'),['protection']);
  assert.deepEqual(suggestedMeanings('starfish'),[]);
  assert.deepEqual(suggestedMeanings('rocket'),[]);
  assert.ok(preferenceError({...manual,manualMeaning:''}));
  assert.ok(preferenceError({...manual,meaningId:''}));
});
test('legacy favourites retain their IDs and audio while new styles and length settings change the candidate pool',()=>{
  assert.deepEqual(parseSavedNames({version:'v1',ids:['lin-mingyuan','chen-jianing','xu2-yunshu']}),['lin-mingyuan','chen-jianing','xu2-yunshu']);
  assert.equal(learningName('lin-mingyuan')!.nameAudio.src,'/name-audio/v1/lin-mingyuan-nameAudio-'+learningName('lin-mingyuan')!.nameAudio.sha256!.slice(0,12)+'.mp3');
  assert.equal(generateNames({...base,givenLength:'1'},{keepIds:['lin-mingyuan']}).retained,0);
  assert.equal(generateNames({...base,theme:'wuxia'},{keepIds:['lin-mingyuan']}).retained,0);
});
