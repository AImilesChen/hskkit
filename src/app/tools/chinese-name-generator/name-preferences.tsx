"use client";
import type {Dispatch,SetStateAction} from 'react';
import {defaultNamePreferences,supportedNameCharacters,type NamePreferences,type NameFeel,type NameTrait} from '@/lib/names/domain';
import {nameThemes,type NameMode,type NameTheme} from '@/lib/names/options';
import {surnameCollection} from '@/lib/names/surnames';
import SurnamePicker from './surname-picker';
import MeaningPicker from './meaning-picker';
import {lookupEnglishName,meaningInspirations,suggestedMeanings,type MeaningId} from '@/lib/names/english-origins';

export default function NamePreferencesForm({value,onChange,onGenerate,notice,error,locked,ready,onNotice}:{value:NamePreferences;onChange:Dispatch<SetStateAction<NamePreferences>>;onGenerate:()=>void;notice:string;error:string;locked:boolean;ready:boolean;onNotice:(message:string)=>void}){
  const roots=lookupEnglishName(value.englishName??'');
  const selectedRoot=roots.find(root=>root.id===value.rootId);
  const surname=surnameCollection.find(item=>item.hanzi===value.surname);
  const exampleSurname=surname?.hanzi??'王';
  function update(patch:Partial<NamePreferences>){onChange(previous=>({...previous,...patch}));onNotice('');}
  function mode(mode:NameMode){if(mode!==value.mode)update({mode,meaningConfirmed:false});}
  function trait(id:NameTrait){
    if(!value.traits.includes(id)&&value.traits.length===2){onNotice('Choose up to two meanings. Deselect one to try another.');return;}
    onChange(previous=>({...previous,traits:previous.traits.includes(id)?previous.traits.filter(t=>t!==id):previous.traits.length<2?[...previous.traits,id]:previous.traits}));onNotice('');
  }
  return <form className="name-preferences name-preferences-v2" onSubmit={event=>{event.preventDefault();onGenerate();}} aria-labelledby="name-preferences-heading" noValidate>
    <div className="name-preference-heading"><h2 id="name-preferences-heading">How would you like to start?</h2><span>Create your Chinese name</span></div>
    <div className="name-mode-options" role="group" aria-label="Choose how to create your name">{[
      {id:'english',mark:'名',label:'From my English name',description:'Keep a meaning that matters to you.'},
      {id:'character',mark:'字',label:'Include a Chinese character',description:'Build around a character you choose.'},
      {id:'meaning',mark:'意',label:'Choose a meaning',description:'Start with qualities and images.'},
    ].map(item=><button key={item.id} type="button" aria-pressed={value.mode===item.id} onClick={()=>mode(item.id as NameMode)}><span lang="zh-Hans" aria-hidden="true">{item.mark}</span><strong>{item.label}</strong><span>{item.description}</span></button>)}</div>

    {value.mode==='english'&&<div className="name-mode-panel name-english-panel"><label htmlFor="english-name">Your English given name</label><input id="english-name" value={value.englishName??''} maxLength={60} autoComplete="off" spellCheck={false} placeholder="For example, Sophia, Alex or Stella" onChange={event=>{const englishName=event.target.value;const found=lookupEnglishName(englishName);update({englishName,rootId:found.length===1?found[0].id:'',useManualMeaning:Boolean(englishName.trim()&&found.length===0),meaningConfirmed:false,manualMeaning:'',meaningId:''});}}/>
      {Boolean(value.englishName?.trim())&&<>
        {roots.length>0&&<fieldset className="name-origin-options"><legend>{roots.length>1?'Choose the origin or interpretation you mean':'Recorded origin & meaning'}</legend>{roots.map(root=><label key={root.id}><input type="radio" name="english-origin" value={root.id} checked={value.rootId===root.id} onChange={()=>update({rootId:root.id,useManualMeaning:!root.inspiration,meaningConfirmed:false})}/><span><strong>{root.origin}</strong><span>{root.meaning}</span><a href={root.source} target="_blank" rel="noreferrer">Meaning reference ↗</a></span></label>)}</fieldset>}
        {roots.length===0&&<p className="name-form-help">This name is not in the current origin reference list. Tell us the meaning you want to keep, then choose its closest naming inspiration.</p>}
        {roots.length>0&&<label className="name-check-label"><input type="checkbox" checked={Boolean(value.useManualMeaning)} onChange={event=>update({useManualMeaning:event.target.checked,meaningConfirmed:false})}/>Use my own intended meaning</label>}
        {value.useManualMeaning&&<div className="name-manual-meaning"><label htmlFor="intended-meaning">Meaning you want to keep</label><textarea id="intended-meaning" rows={2} maxLength={160} value={value.manualMeaning??''} placeholder="For example, protection and care" onChange={event=>{const manualMeaning=event.target.value;const suggested=suggestedMeanings(manualMeaning);update({manualMeaning,meaningId:suggested.length===1?suggested[0]:'',meaningConfirmed:false});}}/><label htmlFor="meaning-inspiration">Match to this naming inspiration</label><select id="meaning-inspiration" value={value.meaningId??''} onChange={event=>update({meaningId:event.target.value as MeaningId,meaningConfirmed:false})}><option value="">Choose an inspiration</option>{meaningInspirations.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select><p className="name-form-help">Matching uses the inspiration you select. Your wording is not treated as a verified name etymology.</p></div>}
        <label className="name-check-label name-confirm-meaning"><input type="checkbox" checked={Boolean(value.meaningConfirmed)} disabled={value.useManualMeaning?!value.manualMeaning?.trim()||!value.meaningId:!selectedRoot?.inspiration} onChange={event=>update({meaningConfirmed:event.target.checked})}/>Use this meaning for my Chinese name</label>
      </>}
    </div>}

    {value.mode==='character'&&<div className="name-mode-panel name-character-input"><div><label htmlFor="keep-character">Character to keep in the given name</label><input id="keep-character" lang="zh-Hans" value={value.character??''} maxLength={8} autoComplete="off" placeholder="宁" onChange={event=>update({character:event.target.value})}/><p className="name-form-help">Enter one character. It will remain in every matching result.</p></div><div><label htmlFor="character-position">Position in the given name</label><select id="character-position" value={value.position??'any'} onChange={event=>update({position:event.target.value as NamePreferences['position']})}><option value="any">Any position</option><option value="first">First character</option><option value="second" disabled={value.givenLength==='1'}>Second character</option></select><p className="name-form-help">A single-character given name has one position.</p></div><details className="name-supported-characters"><summary>Characters you can use ({supportedNameCharacters.length})</summary><div>{supportedNameCharacters.map(char=><button type="button" key={char} lang="zh-Hans" aria-label={`Use character ${char}`} onClick={()=>update({character:char})}>{char}</button>)}</div></details></div>}

    <fieldset className="name-visible-choice"><legend>Name preference</legend><div className="name-gender-options">{([['any','Any'],['masculine','Masculine'],['feminine','Feminine'],['neutral','Neutral']] as const).map(([id,label])=><button type="button" key={id} aria-pressed={value.feel===id} onClick={()=>update({feel:id as NameFeel})}>{label}{value.feel===id&&<span aria-hidden="true">✓</span>}</button>)}</div></fieldset>
    <fieldset className="name-visible-choice"><legend>Name style</legend><div className="name-style-options">{[{id:'any',label:'Any style',description:'Explore every style in the collection.'},...nameThemes].map(theme=><button type="button" key={theme.id} aria-pressed={value.theme===theme.id} onClick={()=>update({theme:theme.id as NameTheme|'any'})}>{theme.label}{value.theme===theme.id&&<span aria-hidden="true">✓</span>}</button>)}</div></fieldset>
    <div className="name-common-settings name-common-settings-v3"><SurnamePicker value={value.surname??'any'} onChange={surname=>update({surname})}/><div><label htmlFor="given-length">Given-name length</label><select id="given-length" value={value.givenLength} onChange={event=>{const givenLength=event.target.value as NamePreferences['givenLength'];update({givenLength,...(givenLength==='1'?{position:'any' as const}:{})});}}><option value="any">Either length</option><option value="1">One character · {exampleSurname}宁</option><option value="2">Two characters · {exampleSurname}嘉宁</option></select><p className="name-form-help">Count only the characters after the family name.</p></div></div>
    <MeaningPicker selected={value.traits} onToggle={trait} onClear={()=>update({traits:[]})}/>
    <div className="name-submit-row"><button type="submit" className="name-primary" disabled={locked||!ready}>Generate names <span aria-hidden="true">→</span></button><button type="button" className="name-text-button" onClick={()=>{onChange({...defaultNamePreferences,traits:[]});onNotice('Choices cleared. Generate names to explore a new set.');}}>Clear choices</button><span>Saved names stay in this browser.</span></div>
    {error&&<p className="name-form-error" role="alert">{error}</p>}
    <p className="name-tool-status" role="status" aria-live="polite">{locked?'All three names are saved. Unsave one to change these choices.':notice}</p>
  </form>;
}
