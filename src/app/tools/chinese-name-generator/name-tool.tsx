"use client";
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';
import { copyableName, generateNames, initialNameIds, learningName, MAX_SAVED_NAMES, NAME_BANK_VERSION, NAME_STORAGE_KEY, nameLearningLinks, parseSavedNames, defaultNamePreferences, nameMatchReasons, nameRecoveryChoices, type LearningName, type NamePreferences } from '@/lib/names/domain';
import NameAudio from './name-audio';
import NamePreferencesForm from './name-preferences';
import {nameThemes} from '@/lib/names/options';

const StrokePlayer=dynamic(()=>import('@/app/components/stroke-player'),{ssr:false,loading:()=> <p role="status">Loading writing practice…</p>});
const startingNames=initialNameIds.map(id=>learningName(id)!);
const feelLabels={neutral:'Neutral',masculine:'Masculine',feminine:'Feminine'};

export default function NameTool() {
  const [preferences,setPreferences]=useState<NamePreferences>({...defaultNamePreferences,traits:[]});
  const [applied,setApplied]=useState(JSON.stringify(preferences));
  const [appliedPreferences,setAppliedPreferences]=useState<NamePreferences>(preferences);
  const [error,setError]=useState('');
  const [results,setResults]=useState<LearningName[]>(startingNames);
  const [selectedId,setSelectedId]=useState<string|undefined>(startingNames[0].id);
  const [saved,setSaved]=useState<string[]>([]);
  const savedRef=useRef<string[]>([]);
  const [hydrated,setHydrated]=useState(false);
  const [generated,setGenerated]=useState(false);
  const [notice,setNotice]=useState('');
  const [storageNotice,setStorageNotice]=useState('');
  const [copyFailure,setCopyFailure]=useState(false);
  const [writing,setWriting]=useState(false);
  const [writingChar,setWritingChar]=useState('');
  const detailRef=useRef<HTMLElement>(null);
  const selected=selectedId?learningName(selectedId):undefined;
  const pending=JSON.stringify(preferences)!==applied;
  const allSaved=!pending&&results.length===3&&results.every(name=>saved.includes(name.id));

  useEffect(()=>{
    try{const restored=parseSavedNames(JSON.parse(localStorage.getItem(NAME_STORAGE_KEY)||'null'));savedRef.current=restored;setSaved(restored);}
    catch{setStorageNotice('Saved names are unavailable in this browser. You can still explore and copy names.');}
    setHydrated(true);
    const sync=(event:StorageEvent)=>{
      if(event.key!==NAME_STORAGE_KEY)return;
      try{const restored=parseSavedNames(JSON.parse(event.newValue||'null'));savedRef.current=restored;setSaved(restored);}catch{savedRef.current=[];setSaved([]);}
    };
    window.addEventListener('storage',sync);
    return()=>window.removeEventListener('storage',sync);
  },[]);
  useEffect(()=>{
    if(!hydrated)return;
    try{localStorage.setItem(NAME_STORAGE_KEY,JSON.stringify({version:NAME_BANK_VERSION,ids:saved}));}
    catch{setStorageNotice('Your saved names will last only for this visit because this browser blocked storage.');}
  },[saved,hydrated]);

  function generate(choices=preferences) {
    window.dispatchEvent(new CustomEvent('hskkit:name-audio-play',{detail:'changing-results'}));
    try {
    const next=generateNames(choices,{keepIds:results.filter(name=>savedRef.current.includes(name.id)).map(name=>name.id),previousIds:results.map(name=>name.id)});
    setError('');setResults(next.items);setGenerated(true);setApplied(JSON.stringify(choices));setAppliedPreferences({...choices,traits:[...choices.traits]});setCopyFailure(false);setWriting(false);
    setSelectedId(next.items.some(name=>name.id===selectedId)?selectedId:next.items[0]?.id);
    setNotice(next.items.length===0?'No exact match in this collection. Try one meaning, another style, or clear your choices.':`${next.items.length} ${next.items.length===1?'name':'names'} to explore.${next.retained?' Your saved choices were kept.':''}${next.items.length<3?' This combination has fewer different given names. Broaden your choices to see more.':''}`);
    trackEvent('name_generate',{mode:choices.mode??'meaning',style:choices.theme??'any',preference:choices.feel,length:choices.givenLength??'any',result_count:next.items.length});
    } catch (failure) {setError(failure instanceof Error?failure.message:'Please check your name choices.');}
  }
  function toggleSaved(id:string) {
    const current=savedRef.current;
    const removing=current.includes(id);
    if(!removing&&current.length>=MAX_SAVED_NAMES){setNotice(`You have saved ${MAX_SAVED_NAMES} names. Remove one before saving another.`);return;}
    const next=removing?current.filter(item=>item!==id):[...current,id];
    savedRef.current=next;setSaved(next);
    setNotice(removing?'Name removed from your saved list.':'Name saved in this browser. It will stay when you generate again.');
    trackEvent('name_save',{name_id:id,action:removing?'remove':'save'});
  }
  function explore(name:LearningName,scroll=true) {
    window.dispatchEvent(new CustomEvent('hskkit:name-audio-play',{detail:'changing-name'}));
    setSelectedId(name.id);setWriting(false);setWritingChar([...name.surname][0]);setCopyFailure(false);
    trackEvent('name_select',{name_id:name.id});
    if(scroll)requestAnimationFrame(()=>{detailRef.current?.scrollIntoView({behavior:'instant',block:'start'});detailRef.current?.focus({preventScroll:true});});
  }
  async function copy() {
    if(!selected)return;
    try{await navigator.clipboard.writeText(copyableName(selected));setNotice('Name, pinyin and introduction copied.');setCopyFailure(false);trackEvent('name_copy',{name_id:selected.id});}
    catch{setCopyFailure(true);setNotice('Select and copy the text below.');}
  }
  const links=selected?nameLearningLinks(selected):undefined;
  return <div className="name-tool" id="name-tool">
    <NamePreferencesForm value={preferences} onChange={setPreferences} onGenerate={()=>generate()} ready={hydrated} locked={allSaved} error={error} onNotice={message=>{setNotice(message);setError('');}} notice={notice||(pending?'Your choices changed. Generate names to apply them.':'Compare up to three names. Save a choice before trying another set.')}/>

    <section className="name-results" aria-labelledby="name-results-heading"><div className="name-results-heading"><div><h2 id="name-results-heading">{generated?'Your names to explore':'A few names to start with'}</h2><p>{generated?'Choose a name to learn its meaning, sound and strokes.':'These examples are ready to listen to, save and learn.'}</p></div><span className="name-count">{results.length} {results.length===1?'name':'names'}</span></div>
      {results.length===0?<div className="name-empty"><h3>Try changing one preference</h3><p>No name matches every choice in this collection. These adjustments keep your selected family name and any character you chose.</p><div className="name-recovery-actions">{nameRecoveryChoices(appliedPreferences).map(choice=><button type="button" className="name-secondary" key={choice.label} onClick={()=>{const next={...appliedPreferences,...choice.patch};setPreferences(next);generate(next);}}>{choice.label}</button>)}<button type="button" className="name-text-button" onClick={()=>{setPreferences({...defaultNamePreferences,traits:[]});setNotice('Choices cleared. Select Generate names to start again.');}}>Clear all choices</button></div></div>:<div className="name-candidates" data-count={results.length}>{results.map((name,index)=><article className={`name-card ${selectedId===name.id?'is-selected':''}`} key={name.id} aria-label={`Name candidate ${index+1}: ${name.hanzi}`}>
        <div className="name-card-top"><span className="name-card-number">{String(index+1).padStart(2,'0')}</span><button className="name-save" type="button" aria-pressed={saved.includes(name.id)} aria-label={`${saved.includes(name.id)?'Unsave':'Save'} ${name.hanzi}`} onClick={()=>toggleSaved(name.id)}><svg viewBox="0 0 24 24" aria-hidden="true" fill={saved.includes(name.id)?'currentColor':'none'} stroke="currentColor" strokeWidth="1.7"><path d="M6 4h12v17l-6-4-6 4V4Z"/></svg>{saved.includes(name.id)?'Saved':'Save'}</button></div>
        <h3 className="name-card-hanzi" lang="zh-Hans"><span>{name.surname}</span>{name.given}</h3><p className="name-card-pinyin">{name.pinyin}</p><p className="name-card-meaning">{name.meaning}</p><p className="name-card-meta">{feelLabels[name.feel]} · {nameThemes.find(theme=>theme.id===(appliedPreferences.theme==='any'||!appliedPreferences.theme?name.styles[0]:appliedPreferences.theme))?.label}</p><ul className="name-match-reasons" aria-label={`Why ${name.hanzi} matches`}>{nameMatchReasons(name,appliedPreferences).slice(0,2).map(reason=><li key={reason}>{reason}</li>)}</ul>
        <div className="name-card-actions"><NameAudio clip={name.nameAudio} nameId={name.id} kind="name"/><button type="button" className="name-learn" aria-label={`Learn this name: ${name.hanzi}`} onClick={()=>explore(name)}>Learn this name <span aria-hidden="true">↗</span></button></div>
      </article>)}</div>}
    </section>

    <details className="name-saved"><summary>Saved names <span>{saved.length}/{MAX_SAVED_NAMES}</span></summary>{saved.length?<ul>{saved.map(id=>{const name=learningName(id)!;return <li key={id}><button type="button" onClick={()=>explore(name)}><strong lang="zh-Hans">{name.hanzi}</strong><span>{name.pinyin}</span></button><button type="button" className="name-text-button" aria-label={`Remove ${name.hanzi} from saved names`} onClick={()=>toggleSaved(id)}>Remove</button></li>;})}</ul>:<p>Use Save on a name you like. Your list stays in this browser.</p>}{storageNotice&&<p role="status">{storageNotice}</p>}</details>

    {selected&&links&&<section className="name-detail" ref={detailRef} tabIndex={-1} aria-labelledby="name-detail-heading">
      <div className="name-detail-heading"><div><span className="name-section-label">Get to know your name</span><h2 id="name-detail-heading"><span lang="zh-Hans">{selected.hanzi}</span><span>{selected.pinyin}</span></h2></div><button type="button" className="name-secondary" onClick={()=>void copy()}>Copy name &amp; pinyin</button></div>
      <div className="name-detail-grid"><div className="name-detail-meaning"><h3>{selected.meaning}</h3><p>{selected.explanation}</p><p className="name-style-label">{feelLabels[selected.feel]} · {selected.styles.map(style=>nameThemes.find(item=>item.id===style)!.label).join(" / ")}</p><p className="name-part-labels">Family name <strong lang="zh-Hans">{selected.surname}</strong><span aria-hidden="true"> · </span>Given name <strong lang="zh-Hans">{selected.given}</strong></p><div className="name-character-breakdown">{selected.characters.map(char=><Link key={`${char.role}-${char.hanzi}`} prefetch={false} href={char.dictionary===false?`/tools/chinese-stroke-order?text=${encodeURIComponent(char.hanzi)}#stroke-tool`:`/character/${encodeURIComponent(char.hanzi)}`} onClick={()=>trackEvent('name_character_open',{name_id:selected.id,character:char.hanzi})}><span>{char.role==='surname'?'Family name':'Given name'}</span><strong lang="zh-Hans">{char.hanzi}</strong><span className="name-char-pinyin">{char.pinyin}</span><p>{char.meaning}</p><span className="name-char-link">{char.dictionary===false?'Watch strokes ↗':'Explore character ↗'}</span></Link>)}</div></div>
      <div className="name-introduction"><span className="name-section-label">Say hello</span><h3>“My name is…”</h3><p className="name-intro-hanzi" lang="zh-Hans">我叫<span>{selected.hanzi}</span>。</p><p className="name-intro-pinyin">{selected.introductionPinyin}</p><NameAudio key={`${selected.id}-intro`} clip={selected.introAudio} nameId={selected.id} kind="introduction"/><div className="name-next-actions"><button type="button" className="name-secondary" onClick={()=>{setWriting(!writing);setWritingChar([...selected.surname][0]);if(!writing)trackEvent('name_writing_start',{name_id:selected.id});}} aria-expanded={writing} aria-controls={writing?"name-inline-writing":undefined}>{writing?'Close writing practice':'Watch strokes & practise'} <span aria-hidden="true">↓</span></button><Link prefetch={false} href={links.worksheet} onClick={()=>trackEvent('name_worksheet_open',{name_id:selected.id})}>Create my name worksheet →</Link></div></div></div>
      {copyFailure&&<div className="name-copy-fallback"><label htmlFor="name-copy-text">Copy your name and introduction</label><textarea id="name-copy-text" readOnly value={copyableName(selected)} onFocus={event=>event.target.select()}/></div>}
      {writing&&<div id="name-inline-writing" className="name-inline-writing"><div className="name-writing-heading"><div><h3>Write one character at a time</h3><p>Choose a character, watch the strokes, then try writing it.</p></div><Link href={links.strokes} prefetch={false}>Open full writing tool ↗</Link></div><div className="name-writing-picker" role="group" aria-label="Choose a character in your name">{selected.characters.map(char=><button key={`${char.role}-${char.hanzi}`} type="button" aria-pressed={writingChar===char.hanzi} onClick={()=>setWritingChar(char.hanzi)}><strong lang="zh-Hans">{char.hanzi}</strong><span>{char.pinyin}</span></button>)}</div><StrokePlayer key={writingChar} character={writingChar||[...selected.surname][0]} worksheetText={selected.hanzi} embedded/></div>}
    </section>}
    <details className="name-about"><summary>About these names &amp; pronunciation</summary><p>Choose from 100 single-character and 20 compound surnames, with 176 selected given names. Name preference, style and length are independent choices. English meanings are naming inspirations rather than unique translations or sound matches. Classical and wuxia explanations describe original imagery, with no invented poem or historical attribution. This is a starting collection, not every Chinese surname or a professional naming service.</p><p>Audio is synthesized Mandarin, prepared in advance as complete names and sentences. It is not a native-speaker recording. Pinyin shows spelling and dictionary tones; connected speech can sound different. The collection has not undergone a full native-speaker pronunciation review.</p><p>A name’s meaning is an interpretation, not a prediction about its owner. For a name you plan to use long term, discuss the full name and its associations with a Chinese speaker who knows you. <Link href="/content-license">Sources &amp; coverage →</Link></p></details>
  </div>;
}
