"use client";
import { useEffect, useRef, useState } from 'react';
import { trackEvent } from '@/lib/analytics';
import type { NameClip } from '@/lib/names/domain';
import {nameAudioUrl} from '@/lib/names/audio-url';

const PLAY_EVENT='hskkit:name-audio-play';
type Phase='ready'|'loading'|'playing'|'paused'|'error'|'unavailable';
export default function NameAudio({clip,nameId,kind}:{clip:NameClip;nameId:string;kind:'name'|'introduction'}) {
  const audioRef=useRef<HTMLAudioElement>(null);
  const operation=useRef(0);
  const busy=useRef(false);
  const loadingTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  const [phase,setPhase]=useState<Phase>(clip.src?'ready':'unavailable');
  const [played,setPlayed]=useState(false);
  const playerId=`${nameId}-${kind}`;
  useEffect(()=>{
    const audio=audioRef.current;
    const stopOther=(event:Event)=>{
      if((event as CustomEvent<string>).detail===playerId)return;
      operation.current+=1;busy.current=false;
      clearTimeout(loadingTimer.current);
      if(audio&&!audio.paused)audio.pause();
      setPhase(current=>current==='loading'?'ready':current);
    };
    window.addEventListener(PLAY_EVENT,stopOther);
    return()=>{operation.current+=1;busy.current=false;clearTimeout(loadingTimer.current);audio?.pause();window.removeEventListener(PLAY_EVENT,stopOther);};
  },[playerId]);
  async function play() {
    const audio=audioRef.current;
    if(!audio||!clip.src||busy.current)return;
    if(phase==='playing'){audio.pause();return;}
    const id=++operation.current;
    busy.current=true;
    window.dispatchEvent(new CustomEvent(PLAY_EVENT,{detail:playerId}));
    try{
      if(phase==='error')audio.load();
      if(phase!=='paused')audio.currentTime=0;
      setPhase('loading');
      loadingTimer.current=setTimeout(()=>{
        if(operation.current!==id)return;
        operation.current+=1;busy.current=false;audio.pause();setPhase('error');
        trackEvent('name_audio_error',{name_id:nameId,kind,reason:'timeout'});
      },15000);
      await audio.play();
      if(operation.current!==id){audio.pause();return;}
      setPhase('playing');
    }catch{if(operation.current===id)setPhase('error');}
    finally{if(operation.current===id){clearTimeout(loadingTimer.current);busy.current=false;}}
  }
  const action=phase==='loading'?'Loading…':phase==='playing'?'Pause':phase==='paused'?'Resume':phase==='error'?'Retry audio':phase==='unavailable'?'Audio unavailable':played?'Listen again':kind==='introduction'?'Listen to introduction':'Listen';
  return <div className="name-audio" data-name-audio-state={phase}>
    {clip.src&&<audio ref={audioRef} src={nameAudioUrl(clip.src)} preload="none" data-name-id={nameId} data-name-audio-kind={kind}
      onPlaying={()=>{clearTimeout(loadingTimer.current);setPhase('playing');trackEvent('name_audio_start',{name_id:nameId,kind});}}
      onPause={()=>setPhase(current=>current==='playing'?'paused':current)}
      onEnded={()=>{setPlayed(true);setPhase('ready');trackEvent('name_audio_complete',{name_id:nameId,kind});}}
      onError={()=>{clearTimeout(loadingTimer.current);busy.current=false;setPhase('error');trackEvent('name_audio_error',{name_id:nameId,kind});}}/>}
    <button type="button" onClick={()=>void play()} disabled={phase==='loading'||phase==='unavailable'} aria-busy={phase==='loading'} aria-label={`${action}: ${clip.text}`}>
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{phase==='playing'?<path d="M9 6v12M15 6v12"/>:phase==='error'?<><path d="M20 11a8 8 0 0 0-15-3M4 4v5h5M4 13a8 8 0 0 0 15 3M20 20v-5h-5"/></>:<><path d="m11 5-5 4H3v6h3l5 4V5Z"/><path d="M16 8a6 6 0 0 1 0 8M19 5a10 10 0 0 1 0 14"/></>}</svg>
      <span>{action}</span>
    </button>
    <span className={phase==='error'?'name-audio-error':'sr-only'} role="status">{phase==='error'?'Audio could not play. Try again.':phase==='playing'?'Playing synthesized Mandarin audio.':phase==='paused'?'Audio paused.':played?'Playback finished.':''}</span>
  </div>;
}
