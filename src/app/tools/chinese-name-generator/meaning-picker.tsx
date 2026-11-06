"use client";
import {useState} from 'react';
import {nameTraits,type NameTrait} from '@/lib/names/editorial';

export default function MeaningPicker({selected,onToggle,onClear}:{selected:NameTrait[];onToggle:(trait:NameTrait)=>void;onClear:()=>void}){
 const [limitMessage,setLimitMessage]=useState('');
 function choose(id:NameTrait){
  if(selected.length===2&&!selected.includes(id)){setLimitMessage('You have chosen two meanings. Remove one to choose another.');return;}
  setLimitMessage('');onToggle(id);
 }
 return <fieldset className="name-meaning-picker" aria-describedby="name-meaning-help">
  <legend>Meaning preferences <span>(optional)</span></legend>
  <div className="name-meaning-heading"><p id="name-meaning-help">Choose up to two ideas. Names can express them with different characters.</p><span className="name-meaning-count" role="status">{selected.length} of 2 selected</span></div>
  <div className="name-meaning-options">{nameTraits.map(item=><button type="button" key={item.id} data-tone={item.tone} aria-pressed={selected.includes(item.id)} title={item.description} onClick={()=>choose(item.id)}><span className="name-meaning-dot" aria-hidden="true"/><span>{item.label}</span><span className="name-meaning-check" aria-hidden="true">{selected.includes(item.id)?'✓':''}</span></button>)}</div>
  {selected.length>0&&<div className="name-meaning-selection"><ul>{selected.map(id=>{const item=nameTraits.find(trait=>trait.id===id)!;return <li key={id}><strong>{item.label}:</strong> {item.description}</li>;})}</ul><button type="button" className="name-text-button" onClick={()=>{setLimitMessage('');onClear();}}>Clear meanings</button></div>}
  {limitMessage&&selected.length===2&&<p className="name-meaning-limit" role="status">{limitMessage}</p>}
 </fieldset>;
}
