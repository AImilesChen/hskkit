"use client";
import { useEffect, useRef, useState } from 'react';
import { AudioPlaybackControl } from '@/app/components/audio-playback-control';
import { NUMBER_QUESTIONS } from '@/lib/numbers/practice';
import { normalizeAnswer, type NumberResult } from '@/lib/numbers/conversion';

function DeviceVoice({text}:{text:string}) {
 const [voice,setVoice]=useState<SpeechSynthesisVoice>();
 const [phase,setPhase]=useState<'loading'|'ready'|'playing'|'error'|'unavailable'>('loading');
 const [message,setMessage]=useState('Checking for a Mandarin voice…');
 const utteranceRef=useRef<SpeechSynthesisUtterance|null>(null);
 useEffect(()=>{
  if(!('speechSynthesis' in window)||!('SpeechSynthesisUtterance' in window)){setPhase('unavailable');setMessage('Device speech is unavailable. Choose a recorded example or try listening practice.');return;}
  const update=()=>{
   const available=speechSynthesis.getVoices().find(v=>/^zh[-_]CN$/i.test(v.lang))??speechSynthesis.getVoices().find(v=>/^zh/i.test(v.lang));
   setVoice(available);
   if(utteranceRef.current)return;
   setPhase(available?'ready':'unavailable');
   setMessage(available?'Ready to play':'No Mandarin device voice found. Choose a recorded example or try listening practice.');
  };
  update();speechSynthesis.addEventListener('voiceschanged',update);
  return()=>{speechSynthesis.removeEventListener('voiceschanged',update);};
 },[]);
 useEffect(()=>()=>{
  if(!utteranceRef.current)return;
  utteranceRef.current=null;
  if('speechSynthesis' in window)speechSynthesis.cancel();
 },[]);
 function speak(){
  if(!voice)return;
  if(phase==='playing'){
   utteranceRef.current=null;speechSynthesis.cancel();setPhase('ready');setMessage('Stopped. Play again when ready.');return;
  }
  try{
   const utterance=new SpeechSynthesisUtterance(text);utterance.voice=voice;utterance.lang=voice.lang;utterance.rate=.85;
   const finish=()=>{if(utteranceRef.current!==utterance)return;utteranceRef.current=null;setPhase('ready');setMessage('Ready to play again');};
   const fail=()=>{if(utteranceRef.current!==utterance)return;utteranceRef.current=null;setPhase('error');setMessage('Device voice could not play. Retry, or choose a recorded example.');};
   utterance.onend=finish;utterance.onerror=fail;
   utteranceRef.current=utterance;setPhase('playing');setMessage('Playing this reading');
   speechSynthesis.cancel();speechSynthesis.speak(utterance);
  }catch{
   utteranceRef.current=null;setPhase('error');setMessage('Device voice could not play. Retry, or choose a recorded example.');
  }
 }
 const action=phase==='playing'?'Stop audio':phase==='loading'?'Checking voice…':phase==='unavailable'?'Audio unavailable':phase==='error'?'Retry audio':'Play audio';
 return <div className="number-audio number-device-voice rounded-xl border border-blue-100 bg-blue-50 p-3" data-audio-state={phase}>
  <div className="flex flex-wrap items-center justify-between gap-3">
   <div className="min-w-48 flex-1"><p className="text-xs font-bold uppercase tracking-wide text-blue-800">Device voice</p><p className="mt-1 text-xs text-slate-600" role="status">{message}</p></div>
   <button type="button" disabled={!voice||phase==='loading'||phase==='unavailable'} aria-busy={phase==='loading'} aria-label={`${action} for this reading. Device voice.`} onClick={speak} className="inline-flex min-h-11 min-w-40 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50">
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{phase==='playing'?<path d="M6 6h12v12H6z"/>:<path d="M11 5 6 9H3v6h3l5 4V5ZM15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12"/>}</svg>
    <span>{action}</span>
   </button>
  </div>
 </div>;
}
export default function ResultSpeech({result}:{result:NumberResult}) {
 // Preserve the exact script: e.g. 12.50 and 12.5 have different decimal readings.
 const item=NUMBER_QUESTIONS.find(q=>q.mode===result.mode&&q.hanzi===result.hanzi&&normalizeAnswer(q.mode,q.value)===normalizeAnswer(result.mode,result.value)&&q.audioSrc);
 if(item)return <AudioPlaybackControl key={item.id} className="number-audio" asset={{id:item.id,src:item.audioSrc,durationSeconds:item.durationSeconds,sourceLabel:'Synthesized pronunciation'}} label="this reading"/>;
 return <DeviceVoice key={result.hanzi} text={result.hanzi}/>;
}
