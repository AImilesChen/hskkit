import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {LEARNING_NAMES,NAME_BANK_VERSION,copyableName,generateNames,initialNameIds,learningName,matchesName,nameLearningLinks,nameTraits,parseSavedNames,type NameFeel,type NameTrait} from '../src/lib/names/domain.ts';

test('all published complete names have name-specific pinyin, original explanations and working character coverage',async()=>{
  const strokes=JSON.parse(await readFile('src/lib/strokes/supported.json','utf8'));
  const index=JSON.parse(await readFile('src/lib/dictionary/character-index.json','utf8'));
  const indexed=new Set(index.characters.map((c:{hanzi:string})=>c.hanzi));
  assert.equal(LEARNING_NAMES.length,21113);
  assert.equal(new Set(LEARNING_NAMES.map(name=>name.hanzi)).size,21113);
  assert.equal(new Set(LEARNING_NAMES.map(name=>name.given)).size,176);
  assert.equal(new Set(LEARNING_NAMES.map(name=>name.id)).size,21113);
  const checked=new Set<string>();
  for(const name of LEARNING_NAMES){
    assert.match(name.hanzi,/^\p{Script=Han}{2,4}$/u,name.id);
    assert.equal(name.hanzi,name.surname+name.given);
    assert.equal(name.characters.map(c=>c.hanzi).join(''),name.hanzi);
    assert.equal(name.characters[0].role,'surname');
    assert.equal(name.characters.filter(c=>c.role==='surname').map(c=>c.hanzi).join(''),name.surname);
    assert.equal(name.pinyin.split(' ').length,2);
    assert.ok(name.meaning.length>15&&name.explanation.length>70,name.id);
    assert.equal(name.introduction,`我叫${name.hanzi}。`);
    for(const char of name.characters){
      assert.ok(char.meaning&&char.pinyin,name.id);
      assert.equal(char.dictionary,indexed.has(char.hanzi),char.hanzi);
      assert.ok(strokes[char.hanzi],char.hanzi);
      if(checked.has(char.hanzi))continue;
      checked.add(char.hanzi);
      const data=JSON.parse(await readFile(`public/stroke-data/v1/${char.hanzi.codePointAt(0)!.toString(16)}.json`,'utf8'));
      assert.equal(data.strokes.length,strokes[char.hanzi]);
    }
  }
  assert.equal(learningName('lin-chengan')?.pinyin,"Lín Chéng'ān");
});

test('every possible style and meaning filter respects constraints, gives unique given names and never silently broadens',()=>{
  const traits=nameTraits.map(t=>t.id);
  const choices:NameTrait[][]=[[],...traits.map(t=>[t]),...traits.flatMap((a,i)=>traits.slice(i+1).map(b=>[a,b]))];
  for(const feel of ['any','neutral','masculine','feminine'] as NameFeel[]){
    for(const selected of choices){
      const preferences={feel,traits:selected};
      const pool=LEARNING_NAMES.filter(name=>matchesName(name,preferences));
      for(const draw of [0,.3,.999999999]){
        const result=generateNames(preferences,{random:()=>draw});
        assert.equal(result.matchCount,pool.length);
        assert.equal(result.items.length,Math.min(3,new Set(pool.map(name=>name.given)).size));
        assert.equal(new Set(result.items.map(name=>name.id)).size,result.items.length);
        assert.equal(new Set(result.items.map(name=>name.given)).size,result.items.length);
        assert.ok(result.items.every(name=>matchesName(name,preferences)));
      }
    }
  }
  for(const bad of [{feel:'bad',traits:[]},{feel:'any',traits:['bad']},{feel:'any',traits:['joy','joy']},{feel:'any',traits:['joy','nature','calm']}]){
    assert.throws(()=>generateNames(bad as Parameters<typeof generateNames>[0]));
  }
});

test('regeneration keeps saved choices, changes the remainder, handles fully locked batches and respects changed preferences',()=>{
  const preferences={feel:'any' as const,traits:[]};
  const first=generateNames(preferences,{random:()=>.4}).items;
  const second=generateNames(preferences,{keepIds:[first[0].id],previousIds:first.map(n=>n.id),random:()=>.8});
  assert.equal(second.items[0].id,first[0].id);
  assert.equal(second.retained,1);
  assert.ok(second.items.slice(1).every(name=>!first.some(old=>old.id===name.id)));
  assert.deepEqual(generateNames(preferences,{keepIds:first.map(n=>n.id)}).items,first);
  const changed={feel:'any' as const,traits:['joy'] as NameTrait[]};
  const noStale=generateNames(changed,{keepIds:['lin-mingyuan']});
  assert.ok(noStale.items.every(name=>name.traits.includes('joy')));
  assert.equal(noStale.retained,0);
  assert.equal(learningName('__proto__'),undefined);
});

test('saved-name storage admits canonical IDs only, removes duplicates and enforces the twelve-name bound',()=>{
  assert.deepEqual(parseSavedNames({version:NAME_BANK_VERSION,ids:['lin-mingyuan','lin-mingyuan','<script>','__proto__',null]}),['lin-mingyuan']);
  for(const malformed of [null,{},[],{version:'old',ids:initialNameIds},{version:NAME_BANK_VERSION,ids:'lin-mingyuan'}])assert.deepEqual(parseSavedNames(malformed),[]);
  assert.equal(parseSavedNames({version:NAME_BANK_VERSION,ids:LEARNING_NAMES.map(n=>n.id)}).length,12);
});

test('learning links carry the exact full name and copy includes the correct introduction',()=>{
  for(const name of LEARNING_NAMES){
    const links=nameLearningLinks(name);
    assert.equal(new URL(links.strokes,'https://hskkit.com').searchParams.get('text'),name.hanzi);
    assert.equal(new URL(links.worksheet,'https://hskkit.com').searchParams.get('text'),name.hanzi);
    assert.equal(new URL(links.strokes,'https://hskkit.com').hash,'#stroke-tool');
    assert.equal(copyableName(name).split('\n')[3],name.introduction);
  }
});

test('all complete-name and introduction recordings pair the exact complete utterance with an existing immutable MP3 and valid checksum',async()=>{
  const manifest=JSON.parse(await readFile('public/name-data/v3/audio-manifest.json','utf8'));
  const audio=new Map(manifest.items.map((item:{id:string})=>[item.id,item]));
  assert.equal(manifest.items.length,LEARNING_NAMES.length);
  const jobs=LEARNING_NAMES.flatMap(name=>(['nameAudio','introAudio'] as const).map(key=>({name,key})));
  let cursor=0;
  await Promise.all(Array.from({length:12},async()=>{
    while(cursor<jobs.length){
      const {name,key}=jobs[cursor++];
      const clip=(audio.get(name.id) as typeof name)[key];
      const expected=key==='nameAudio'?name.hanzi+'。':name.introduction;
      assert.equal(clip.text,expected,name.id);
      assert.match(clip.src!,/^\/name-audio\/v(?:1|3)\/[a-zA-Z0-9-]+\.mp3$/);
      assert.equal(name[key].src,clip.src);
      const bytes=await readFile('public'+clip.src);
      assert.equal(createHash('sha256').update(bytes).digest('hex'),clip.sha256,name.id+' '+key);
      assert.equal(createHash('sha256').update(expected+'|zh-CN-XiaoxiaoNeural|-10%').digest('hex'),clip.scriptSha256);
      if(clip.synthesisText)assert.equal(createHash('sha256').update(clip.synthesisText+'|zh-CN-XiaoxiaoNeural|-10%').digest('hex'),clip.synthesisScriptSha256);
      assert.ok(bytes.length>1000&&clip.durationSeconds!>.3&&clip.durationSeconds!<15);
    }
  }));
});
