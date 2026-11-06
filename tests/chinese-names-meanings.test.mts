import test from 'node:test';
import assert from 'node:assert/strict';
import {givenNames} from '../src/lib/names/editorial.ts';
import {expandedNames} from '../src/lib/names/expanded-editorial.ts';
import {collectionNames} from '../src/lib/names/collection-editorial.ts';
import {surnameCollection} from '../src/lib/names/surnames.ts';
import {allowedNameCombination} from '../src/lib/names/combination.ts';
import {nameTraits,LEARNING_NAMES,defaultNamePreferences as base,generateNames,learningName,matchesName,nameMatchReasons,nameRecoveryChoices,type NameTrait} from '../src/lib/names/domain.ts';

test('twelve distinct meaning pools have genuine masculine, feminine and neutral candidates',()=>{
 assert.equal(nameTraits.length,12);
 assert.equal(new Set(nameTraits.map(item=>item.id)).size,12);
 const pools=nameTraits.map(trait=>{
  for(const feel of ['any','masculine','feminine','neutral'] as const){
   const p={...base,surname:'林',feel,traits:[trait.id]};
   const result=generateNames(p,{random:()=>.4});
   assert.equal(result.items.length,3,`${trait.id} ${feel}`);
   assert.equal(new Set(result.items.map(name=>name.given)).size,3);
   assert.ok(result.items.every(name=>name.traits.includes(trait.id)&&(feel==='any'||name.feel===feel)));
  }
  return [...new Set(LEARNING_NAMES.filter(name=>name.traits.includes(trait.id)).map(name=>name.given))].sort().join('|');
 });
 assert.equal(new Set(pools).size,12,'Meaning buttons must not all expose the same name set.');
});

test('meaning choices filter ideas rather than requiring the old representative character',()=>{
 assert.ok(matchesName(learningName('lin-bowen')!,{...base,traits:['wisdom']}));
 assert.ok(!learningName('lin-bowen')!.given.includes('知'));
 const examples:[string,NameTrait,NameTrait][]=[['meaning-jiarui','fortune','kindness'],['meaning-renya','kindness','fortune'],['meaning-shuyun','freedom','fortune'],['meaning-jinming','beauty','kindness'],['meaning-mingxi','hope','fortune'],['meaning-ziruo','confidence','fortune']];
 for(const [id,yes,no] of examples){const name=learningName('lin-'+id)!;assert.ok(matchesName(name,{...base,traits:[yes]}),id);assert.equal(matchesName(name,{...base,traits:[no]}),false,id);}
 assert.ok(matchesName(learningName('lin-meaning-ruian')!,{...base,mode:'english',englishName:'Felix',rootId:'felix',meaningConfirmed:true}));
});

test('two meaning filters intersect, appear in applied reasons, and reject duplicate or third choices',()=>{
 const p={...base,surname:'林',traits:['kindness','fortune'] as NameTrait[]};
 const result=generateNames(p);
 assert.equal(result.items.length,3);
 assert.ok(result.items.every(name=>p.traits.every(id=>name.traits.includes(id))));
 assert.ok(nameMatchReasons(result.items[0],p).some(reason=>reason.includes('kindness & care')&&reason.includes('good fortune')));
 for(const traits of [['hope','hope'],['hope','beauty','fortune'],['not-real']])assert.throws(()=>generateNames({...base,traits:traits as NameTrait[]}));
 const conflict={...base,mode:'character' as const,surname:'欧阳',character:'宁',givenLength:'1' as const,traits:['fortune'] as NameTrait[]};
 assert.equal(generateNames(conflict).items.length,0);
 for(const recovery of nameRecoveryChoices(conflict)){
  const next={...conflict,...recovery.patch};assert.equal(next.surname,'欧阳');assert.equal(next.character,'宁');assert.ok(generateNames(next).items.length>0);
 }
});

test('original 161 given-name IDs remain available alongside the new original selections',()=>{
 const before=[...givenNames,...expandedNames,...collectionNames];
 assert.equal(before.length,161);
 for(const surname of surnameCollection)for(const name of before){
  if(!allowedNameCombination(surname.hanzi,name.given))continue;
  const id=`${surname.id}-${name.id}`;
  const current=learningName(id);
  assert.ok(current,id);assert.equal(current.given,name.given);assert.equal(current.pinyin,`${surname.pinyin} ${name.pinyin}`);
 }
 assert.equal(new Set(LEARNING_NAMES.map(name=>name.given)).size,176);
});
