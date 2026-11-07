"use client";
import {useEffect,useId,useRef,useState} from 'react';
import type {NewEntry} from '@/lib/vocabulary-comparison/domain';

export default function ComparisonAudio({entry}:{entry?:NewEntry}){
 const id=useId(),audio=useRef<HTMLAudioElement>(null),operation=useRef(0),requestToken=useRef(0),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 const [phase,setPhase]=useState<'ready'|'loading'|'playing'|'paused'|'error'>('ready');
 useEffect(()=>{
  const player=audio.current;const tokenCounter=operation;
  const stop=(event:Event)=>{if((event as CustomEvent).detail!==id){operation.current++;clearTimeout(timer.current);player?.pause();setPhase('ready');}};
  window.addEventListener('hskkit:comparison-play',stop);
  return()=>{tokenCounter.current++;clearTimeout(timer.current);player?.pause();window.removeEventListener('hskkit:comparison-play',stop);};
 },[id,entry?.audioSrc]);
 async function play(){
  const player=audio.current;if(!player||!entry?.audioSrc||phase==='loading')return;
  if(phase==='playing'){player.pause();return;}
  window.dispatchEvent(new CustomEvent('hskkit:comparison-play',{detail:id}));
  const token=++operation.current;requestToken.current=token;setPhase('loading');
  if(phase==='error')player.load();
  if(phase!=='paused')player.currentTime=0;
  timer.current=setTimeout(()=>{if(operation.current===token){operation.current++;player.pause();setPhase('error');}},15000);
  try{await player.play();if(operation.current!==token){player.pause();return;}clearTimeout(timer.current);setPhase('playing');}
  catch{if(operation.current===token){clearTimeout(timer.current);setPhase('error');}}
 }
 const action=phase==='playing'?'Pause':phase==='paused'?'Resume':phase==='loading'?'Loading':phase==='error'?'Retry':'Listen to';
 if(!entry?.audioSrc)return null;
 return <span className="cmp-audio">
  {entry?.audioSrc&&<audio ref={audio} src={entry.audioSrc} preload="none" onPlaying={()=>{if(operation.current!==requestToken.current){audio.current?.pause();return;}clearTimeout(timer.current);setPhase('playing');}} onPause={()=>setPhase(value=>value==='playing'?'paused':value)} onEnded={()=>setPhase('ready')} onError={()=>{if(operation.current===requestToken.current){clearTimeout(timer.current);setPhase('error');}}}/>}
  <button type="button" className="cmp-audio-button" disabled={!entry?.audioSrc||phase==='loading'} aria-busy={phase==='loading'} aria-label={entry?.audioSrc?`${action} ${entry.headword} (${entry.pinyin})`:'Recording unavailable'} title={entry?.audioSrc?`${action} ${entry.pinyin}`:'A recording is not available for this entry.'} onClick={()=>void play()}>
   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">{phase==='playing'?<path d="M9 6v12M15 6v12"/>:<><path d="m11 5-5 4H3v6h3l5 4V5Z"/>{entry?.audioSrc?<path d="M16 8a6 6 0 0 1 0 8M19 5a10 10 0 0 1 0 14"/>:<path d="m16 9 5 6m0-6-5 6"/>}</>}</svg>
  </button><span role="status" className={phase==='error'?'cmp-audio-error':'sr-only'}>{phase==='error'?'Audio failed. Try again.':phase==='playing'?'Playing recorded synthesized pronunciation.':''}</span>
 </span>;
}
