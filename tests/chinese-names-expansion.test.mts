import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {LEARNING_NAMES,defaultNamePreferences as base,generateNames,learningName,matchesName,nameLearningLinks,nameRecoveryChoices,parseSavedNames} from '../src/lib/names/domain.ts';
import {surnameCollection,searchSurnames} from '../src/lib/names/surnames.ts';
import {allowedNameCombination} from '../src/lib/names/combination.ts';
import {nameAudioUrl} from '../src/lib/names/audio-url.ts';

test('120 surnames support tone-folded pinyin, Chinese, traditional forms and compound filtering',()=>{
 assert.equal(surnameCollection.filter(s=>s.kind==='single').length,100);
 assert.equal(surnameCollection.filter(s=>s.kind==='compound').length,20);
 assert.equal(new Set(surnameCollection.map(s=>s.hanzi)).size,120);
 for(const term of ['欧阳','歐陽','ouyang','Ōuyáng','ou yang'])assert.ok(searchSurnames(term).some(s=>s.hanzi==='欧阳'));
 for(const term of ['lv','lü','lǚ','lu:'])assert.ok(searchSurnames(term).some(s=>s.hanzi==='吕'),term);
 assert.ok(searchSurnames('曾')[0].pinyin==='Zēng');
 assert.ok(searchSurnames('任')[0].pinyin==='Rén');
 assert.ok(searchSurnames('尉迟')[0].pinyin==='Yùchí');
 assert.ok(searchSurnames('长孙')[0].pinyin==='Zhǎngsūn');
 assert.ok(searchSurnames('宁')[0].pinyin==='Nìng');
 assert.equal(searchSurnames('','compound').length,20);
 assert.equal(searchSurnames('not-a-surname').length,0);
});

test('gender, style and length have independent coverage for every supported surname',()=>{
 for(const surname of surnameCollection)for(const feel of ['masculine','feminine','neutral'] as const)for(const theme of ['modern','poetic','classical','wuxia'] as const)for(const givenLength of ['1','2'] as const){
  const p={...base,surname:surname.hanzi,feel,theme,givenLength};
  const results=generateNames(p,{random:()=>.4});
  assert.equal(results.items.length,3,`${surname.hanzi} ${feel} ${theme} ${givenLength}`);
  assert.ok(results.items.every(n=>n.surname===surname.hanzi&&n.feel===feel&&matchesName(n,p)));
 }
});

test('compound surnames stay intact in pinyin, character roles, fixed-character results and learning links',()=>{
 const p={...base,mode:'character' as const,surname:'欧阳',character:'宁',givenLength:'1' as const};
 const result=generateNames(p).items;
 assert.deepEqual(result.map(n=>n.hanzi),['欧阳宁']);
 assert.equal(result[0].pinyin,'Ōuyáng Níng');
 assert.deepEqual(result[0].characters.map(c=>c.role),['surname','surname','given']);
 assert.deepEqual(result[0].characters.map(c=>c.pinyin),['ōu','yáng','níng']);
 assert.equal(new URL(nameLearningLinks(result[0]).worksheet,'https://hskkit.com').searchParams.get('text'),'欧阳宁');
 assert.equal(result[0].introAudio.text,'我叫欧阳宁。');
 const doubles=generateNames({...p,givenLength:'2',position:'second'}).items;
 assert.ok(doubles.every(n=>[...n.hanzi].length===4&&n.given.endsWith('宁')));
});

test('recovery explicitly changes one secondary preference and keeps surname and fixed character',()=>{
 const p={...base,mode:'character' as const,surname:'欧阳',character:'宁',feel:'feminine' as const,givenLength:'1' as const};
 assert.equal(generateNames(p).items.length,0);
 const choices=nameRecoveryChoices(p);
 assert.ok(choices.length>0);
 for(const choice of choices){
  assert.equal(Object.keys(choice.patch).length,1);
  const next={...p,...choice.patch};
  assert.equal(next.surname,p.surname);assert.equal(next.character,p.character);
  assert.ok(generateNames(next).items.length>0);
 }
});

test('combination checks and legacy storage preserve genuine names without adding duplicate candidates',async()=>{
 assert.equal(allowedNameCombination('宁','宁'),false);
 assert.equal(allowedNameCombination('吴','勇'),false);
 assert.ok(LEARNING_NAMES.every(n=>allowedNameCombination(n.surname,n.given)));
 const bank=JSON.parse(await readFile('src/lib/names/bank.json','utf8'));
 assert.equal(bank.legacyAudio.length,712);
 for(const old of bank.legacyAudio){assert.ok(learningName(old.id));assert.equal(learningName(old.id)!.nameAudio.src,old.nameAudio.src);assert.deepEqual(parseSavedNames({version:'v1',ids:[old.id]}),[old.id]);}
});
test('expanded audio can use an explicit static origin while original audio URLs stay stable',()=>{
 assert.equal(nameAudioUrl('/name-audio/v3/example.mp3',''),'\/name-audio/v3/example.mp3');
 assert.equal(nameAudioUrl('/name-audio/v3/example.mp3','https://assets.example.com'),'https://assets.example.com/name-audio/v3/example.mp3');
 assert.equal(nameAudioUrl('/name-audio/v1/legacy.mp3','https://assets.example.com'),'/name-audio/v1/legacy.mp3');
 for(const base of ['http://assets.example.com','https://user:password@assets.example.com','https://assets.example.com/private','https://assets.example.com?token=secret'])assert.throws(()=>nameAudioUrl('/name-audio/v3/example.mp3',base));
});
