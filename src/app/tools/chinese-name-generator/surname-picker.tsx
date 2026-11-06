"use client";
import {useEffect,useRef,useState} from 'react';
import {quickSurnameIds,searchSurnames,surnameCollection} from '@/lib/names/surnames';

export default function SurnamePicker({value,onChange}:{value:string;onChange:(value:string)=>void}){
 const [open,setOpen]=useState(false),[query,setQuery]=useState(''),[kind,setKind]=useState<'all'|'single'|'compound'>('all');
 const container=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null),search=useRef<HTMLInputElement>(null),resultList=useRef<HTMLDivElement>(null);
 const selected=surnameCollection.find(item=>item.hanzi===value);
 const results=searchSurnames(query,kind);
 useEffect(()=>{
  if(!open)return;
  search.current?.focus();
  const outside=(event:PointerEvent)=>{if(!container.current?.contains(event.target as Node))setOpen(false);};
  document.addEventListener('pointerdown',outside);
  return()=>document.removeEventListener('pointerdown',outside);
 },[open]);
 function choose(surname:string){onChange(surname);setOpen(false);setQuery('');trigger.current?.focus();}
 return <div className="name-surname-picker" ref={container} onKeyDown={event=>{if(event.key==='Escape'&&open){event.preventDefault();setOpen(false);trigger.current?.focus();}}}>
  <span className="name-field-label" id="name-surname-label">Family name</span>
  <button ref={trigger} type="button" className="name-surname-trigger" aria-labelledby="name-surname-label name-surname-value" aria-expanded={open} aria-controls={open?'surname-search-panel':undefined} onClick={()=>setOpen(!open)}><span id="name-surname-value">{selected?<><span lang="zh-Hans">{selected.hanzi}</span> <span>{selected.pinyin}</span></>:'Random family name'}</span><span className="name-surname-search-hint" aria-hidden="true">Search all {surnameCollection.length} ⌄</span></button>
  {open&&<section className="name-surname-panel" id="surname-search-panel" aria-label="Find a family name">
   <div className="name-surname-panel-top"><label htmlFor="surname-query">Search surnames</label><button type="button" aria-label="Close surname search" onClick={()=>{setOpen(false);trigger.current?.focus();}}>×</button></div>
   <input ref={search} id="surname-query" value={query} onChange={event=>setQuery(event.target.value)} onKeyDown={event=>{if(event.key==='Enter'){event.preventDefault();if(results.length===1)choose(results[0].hanzi);}if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();const buttons=resultList.current?.querySelectorAll<HTMLButtonElement>('button');(event.key==='ArrowDown'?buttons?.[0]:buttons?.[buttons.length-1])?.focus();}}} autoComplete="off" placeholder="陈, chen, 欧阳 or ouyang"/>
   <div className="name-surname-filters" role="group" aria-label="Surname type">{([['all','All'],['single','Single-character'],['compound','Compound']] as const).map(([id,label])=><button key={id} type="button" aria-pressed={kind===id} onClick={()=>setKind(id)}>{label}</button>)}</div>
   <button type="button" className="name-surname-random" aria-pressed={value==='any'} onClick={()=>choose('any')}>Suggest a family name for me</button>
   <p className="name-surname-result-count" role="status">{results.length} {results.length===1?'surname':'surnames'}</p>
   {results.length?<div ref={resultList} className="name-surname-results" role="group" aria-label="Matching surnames" onKeyDown={event=>{if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;event.preventDefault();const buttons=Array.from(resultList.current?.querySelectorAll<HTMLButtonElement>('button')??[]);const active=buttons.indexOf(document.activeElement as HTMLButtonElement);const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(active+(event.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length;buttons[next]?.focus();}}>{results.map(item=><button type="button" key={item.id} aria-pressed={value===item.hanzi} aria-label={`Choose surname ${item.hanzi} ${item.pinyin}`} onClick={()=>choose(item.hanzi)}><strong lang="zh-Hans">{item.hanzi}</strong><span>{item.pinyin}</span></button>)}</div>:<p className="name-surname-no-match">This surname is not in the collection yet. Try another spelling or browse the list. Your search stays here.</p>}
  </section>}
  <div className="name-surname-quick" role="group" aria-label="Quick surname choices">{quickSurnameIds.map(id=>surnameCollection.find(item=>item.id===id)!).map(item=><button type="button" lang="zh-Hans" key={item.id} aria-label={`Use surname ${item.hanzi} ${item.pinyin}`} aria-pressed={value===item.hanzi} onClick={()=>choose(item.hanzi)}>{item.hanzi}</button>)}</div>
 </div>;
}
