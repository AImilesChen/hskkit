"use client";
import { useEffect, useRef, useState } from 'react';
import { AudioPlaybackControl } from '@/app/components/audio-playback-control';
import { NUMBER_MODES, convert, type NumberMode, type NumberResult } from '@/lib/numbers/conversion';
import { checkNumberAnswer, createNumberRound, isNumberComplete, numberAnswerCorrect, numberQuestion, numberRoundReport, parseNumberHistory, retryNumberMistakes, type NumberRound } from '@/lib/numbers/practice';
import { scenes } from './number-scenes';
import ResultSpeech from './result-speech';

const initialDrafts=Object.fromEntries(scenes.map(s=>[s.id,s.initial])) as Record<NumberMode,string>;
const initialResults=Object.fromEntries(scenes.map(s=>[s.id,convert(s.id,s.initial)])) as Record<NumberMode,NumberResult>;
const storageKey='hskkit.number-practice.v1';

export default function NumberTool() {
 const [view,setView]=useState<'convert'|'practice'>('convert');
 const [mode,setMode]=useState<NumberMode>('numbers');
 const [drafts,setDrafts]=useState(initialDrafts);
 const [results,setResults]=useState(initialResults);
 const [committed,setCommitted]=useState(initialDrafts);
 const [reverse,setReverse]=useState(false);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [history,setHistory]=useState<NumberRound[]>([]);
 const [hydrated,setHydrated]=useState(false);
 const [storageNotice,setStorageNotice]=useState('');
 const [activeId,setActiveId]=useState<string>();
 const [feedback,setFeedback]=useState<number>();
 const [answer,setAnswer]=useState('');
 const [heard,setHeard]=useState('');
 const [audioFailed,setAudioFailed]=useState(false);
 const [speed,setSpeed]=useState(1);
 const practiceHeading=useRef<HTMLHeadingElement>(null);
 const active=history.find(s=>s.id===activeId);
 const current=active?numberQuestion(active.order[feedback??active.answers.length]):undefined;
 const scene=scenes.find(s=>s.id===mode)!;
 const result=results[mode];
 const pending=drafts[mode]!==committed[mode];
 const resumed=history.find(s=>s.mode===mode&&!isNumberComplete(s));
 const lastCompleted=history.find(s=>s.mode===mode&&isNumberComplete(s));

 useEffect(()=>{
  try{setHistory(parseNumberHistory(JSON.parse(localStorage.getItem(storageKey)||'[]')));}catch{setStorageNotice('Browser storage is unavailable. Practice still works while this page stays open.');}
  setHydrated(true);
  const params=new URLSearchParams(location.search);const incoming=params.get('mode');const value=params.get('value');
  if(incoming&&NUMBER_MODES.includes(incoming as NumberMode)){
   const selected=incoming as NumberMode;setMode(selected);
   if(value&&value.length<=80){try{const output=convert(selected,value);setDrafts(d=>({...d,[selected]:value}));setCommitted(d=>({...d,[selected]:value}));setResults(r=>({...r,[selected]:output}));}catch{setNotice('That linked example could not be read. A supported example is shown instead.');}}
  }
 },[]);
 useEffect(()=>{
  if(!hydrated)return;
  try{localStorage.setItem(storageKey,JSON.stringify(history));}catch{setStorageNotice('Practice cannot be saved in this browser. Keep the page open to retain this round.');}
 },[history,hydrated]);
 useEffect(()=>{setAnswer('');setHeard('');setAudioFailed(false);setError('');},[current?.id,activeId]);
 useEffect(()=>{if(activeId)practiceHeading.current?.focus({preventScroll:true});},[activeId,current?.id,feedback]);

 function changeScene(next:NumberMode){setMode(next);setActiveId(undefined);setFeedback(undefined);setError('');setNotice('');}
 function changeView(next:'convert'|'practice'){setView(next);setError('');setNotice('');}
 function runConversion(value=drafts[mode]){
  try{const output=convert(mode,value,mode==='numbers'&&reverse);setResults(r=>({...r,[mode]:output}));setDrafts(d=>({...d,[mode]:value}));setCommitted(d=>({...d,[mode]:value}));setError('');setNotice('Reading updated.');}
  catch(e){setError(e instanceof Error?e.message:'Check your input and try again.');setNotice('');}
 }
 function chooseExample(value:string){const input=mode==='numbers'&&reverse?convert('numbers',value).hanzi:value;runConversion(input);}
 function toggleDirection(){const next=!reverse;setReverse(next);const value=next?result.hanzi:result.value;setDrafts(d=>({...d,numbers:value}));setCommitted(d=>({...d,numbers:value}));setError('');setNotice('');}
 async function copy(){try{await navigator.clipboard.writeText(`${result.value}\n${result.hanzi}\n${result.pinyin}`);setNotice('Reading copied.');}catch{setNotice('Copy is unavailable. Select the reading above to copy it.');}}
 function openRound(round:NumberRound){setHistory(h=>[round,...h.filter(r=>r.id!==round.id)].slice(0,20));setActiveId(round.id);setFeedback(undefined);setAnswer('');setHeard('');setSpeed(1);setError('');}
 function start(){try{openRound(createNumberRound(mode));}catch(e){setError((e as Error).message);}}
 function submit(){if(!active||!current||feedback!==undefined)return;try{const checked=checkNumberAnswer(active,current.id,answer,heard===current.id&&!audioFailed);setHistory(h=>h.map(s=>s.id===checked.id?checked:s));setFeedback(active.answers.length);setError('');}catch(e){setError((e as Error).message);}}
 function next(){setFeedback(undefined);setAnswer('');setHeard('');setError('');}
 function retry(){if(!active)return;const round=retryNumberMistakes(active);if(round)openRound(round);}
 const report=active?numberRoundReport(active):undefined;

 return <div id="number-tool" className="number-tool" data-number-scene={mode}>
  <div className="number-view-switch" role="group" aria-label="How to use this tool"><button type="button" aria-pressed={view==='convert'} onClick={()=>changeView('convert')}>Convert &amp; learn</button><button type="button" aria-pressed={view==='practice'} onClick={()=>changeView('practice')}>Listening practice</button></div>
  <div className="number-scenes" role="group" aria-label="Choose a number scene">{scenes.map(s=><button type="button" key={s.id} data-number-scene={s.id} aria-pressed={mode===s.id} onClick={()=>changeScene(s.id)}><span className="number-scene-mark" aria-hidden="true">{s.chinese}</span><strong>{s.title}</strong><span>{s.description}</span></button>)}</div>
  {view==='convert'?<div className="number-converter">
   <section className="number-input-card" aria-labelledby="number-input-heading"><h2 id="number-input-heading">{scene.title} in Chinese</h2>
    {mode==='numbers'&&<div className="number-direction" role="group" aria-label="Conversion direction"><button type="button" aria-pressed={!reverse} onClick={()=>{if(reverse)toggleDirection();}}>Digits → Chinese</button><button type="button" aria-pressed={reverse} onClick={()=>{if(!reverse)toggleDirection();}}>Chinese → digits</button></div>}
    <form onSubmit={e=>{e.preventDefault();runConversion();}} noValidate><label htmlFor="number-value">{mode==='numbers'&&reverse?'Chinese number to convert':scene.label}</label><div className="number-input-unit"><input id="number-value" type={mode==='dates'?'date':mode==='times'?'time':'text'} inputMode={mode==='numbers'&&reverse?undefined:mode==='prices'?'decimal':mode==='numbers'?'text':undefined} value={drafts[mode]} onChange={e=>{setDrafts(d=>({...d,[mode]:e.target.value}));setError('');setNotice('');}} maxLength={80} min={mode==='dates'?'1900-01-01':undefined} max={mode==='dates'?'2100-12-31':undefined} aria-describedby="number-input-hint" aria-invalid={Boolean(error)}/>{mode==='prices'&&<span>RMB</span>}</div><p id="number-input-hint">{mode==='numbers'&&reverse?'Use a complete form, e.g. 一百零五 (105).':scene.hint}</p><button className="number-primary" type="submit">{reverse&&mode==='numbers'?'Convert to digits':'Show Chinese reading'} <span aria-hidden="true">→</span></button></form>
    <div className="number-examples"><span>Try an example</span><div>{scene.examples.map(value=><button type="button" key={value} onClick={()=>chooseExample(value)}>{mode==='prices'?'¥':''}{value}</button>)}</div></div>
    {error&&<p className="number-error" role="alert">{error}</p>}
   </section>
   <section className={`number-result-card ${pending?'is-pending':''}`} aria-label="Converted reading" aria-busy={pending}>
    {pending?<div className="number-pending"><h2>Ready to convert?</h2><p>Select {mode==='numbers'&&reverse?'Convert to digits':'Show Chinese reading'} to see the new result.</p></div>:<>
    <div className="number-result-top"><span className="number-badge">{mode==='prices'?'Spoken price':mode==='dates'?'Spoken date':mode==='times'?'Spoken time':'Chinese number'}</span><span className="number-result-value">{mode==='prices'?'¥':''}{result.value}</span></div>
    <p className={`number-hanzi ${result.hanzi.length>12?'is-long':''}`} lang="zh-Hans">{result.hanzi}</p><p className="number-pinyin">{result.pinyin}</p>
    {result.written&&mode!=='numbers'&&<div className="number-written"><span>{mode==='times'?'Full minute reading':'Written form'}</span><strong lang="zh-Hans">{result.written}</strong></div>}
    <ResultSpeech result={result}/><div className="number-result-actions"><button type="button" onClick={()=>void copy()}>Copy reading</button><button type="button" onClick={()=>changeView('practice')}>Practise {scene.title.toLowerCase()} →</button></div>
    <details className="number-reading-notes"><summary>Reading notes</summary>
     <div className="number-breakdown">{result.parts.map(part=><div key={part.label}><span>{part.label}</span><strong>{part.value}</strong><small lang="zh-Hans">{part.hanzi}</small></div>)}</div><p className="number-explanation">{result.explanation}</p>
     <h3>Pinyin &amp; audio</h3><p>Pinyin shows dictionary tones. The spoken tones of 一 and third-tone pairs can change in a phrase.</p><p>Recorded examples use fixed synthesized audio. Other readings use your device’s Mandarin voice, when available; voices vary by browser.</p>
     {mode==='numbers'&&<><h3>Financial characters</h3><p className="number-financial" lang="zh-Hans">{result.written}</p><p>Character equivalents for learning, without financial document formatting.</p></>}
    </details>
    </>}
   </section>
  </div>:<section className="number-practice" aria-labelledby="number-practice-heading">
   {!active?<><div className="number-practice-intro"><div><h2 id="number-practice-heading">Practise {scene.title.toLowerCase()}</h2><p>10 questions. Replay as often as you need.</p></div><span className="number-badge">40 recordings</span></div><ol className="number-practice-steps"><li><span>01</span>Listen to the clip.</li><li><span>02</span>Type the digits.</li><li><span>03</span>Check and review.</li></ol><div className="number-start-row"><p>{scene.answerHint}</p><button className="number-primary" type="button" disabled={!hydrated} onClick={start}>{hydrated?'Start 10 questions →':'Loading practice…'}</button></div>{resumed&&<div className="number-resume"><p>Saved round: {resumed.answers.length} of {resumed.order.length} answered{resumed.retryOf?' · mistake review':''}.</p><button type="button" onClick={()=>openRound(resumed)}>Continue saved round →</button></div>}{lastCompleted&&<p className="number-last">Last result: {numberRoundReport(lastCompleted).correct} / {lastCompleted.order.length}{lastCompleted.retryOf?' · mistake review':' · first pass'}.</p>}</>:
    isNumberComplete(active)&&feedback===undefined?<><p className="number-round-label">{scene.title} · {active.retryOf?'Mistake review':'First pass'}</p><h2 id="number-practice-heading" ref={practiceHeading} tabIndex={-1}>Round complete</h2><p className="number-score">{report!.correct}<span> / {active.order.length}</span></p><p>{report!.percent}% correct · {active.retryOf?'Original score unchanged.':'First checked answers count.'}</p><div className="number-summary-actions">{report!.misses.length>0&&<button className="number-primary" type="button" onClick={retry}>Practise {report!.misses.length} {report!.misses.length===1?'mistake':'mistakes'} →</button>}<button type="button" onClick={start}>Start a new round</button><button type="button" onClick={()=>{setActiveId(undefined);setFeedback(undefined);}}>Back to practice setup</button></div><h3>Your answers</h3><ol className="number-review">{active.order.map((id,i)=>{const q=numberQuestion(id)!;return <li key={id}><span className={numberAnswerCorrect(active,i)?'number-correct':'number-incorrect'}>{numberAnswerCorrect(active,i)?'Correct':'Review'}</span><div><strong>{mode==='prices'?'¥':''}{q.value}</strong><p lang="zh-Hans">{q.hanzi}</p><small>Your answer: {active.answers[i]}</small></div></li>;})}</ol></>:
    current&&<><div className="number-question-top"><span className="number-badge">{active.retryOf?'Mistake review':'First pass'} · {scene.title}</span><button type="button" onClick={()=>{setActiveId(undefined);setFeedback(undefined);}}>Save &amp; leave round</button></div><p className="number-question-count">Question {(feedback??active.answers.length)+1} of {active.order.length}</p><h2 id="number-practice-heading" ref={practiceHeading} tabIndex={-1}>What did you hear?</h2><p className="number-question-hint">{scene.answerHint}</p><div className="number-listen"><AudioPlaybackControl key={current.id} className="number-audio" asset={{id:current.id,src:current.audioSrc,durationSeconds:current.durationSeconds,sourceLabel:'Synthesized pronunciation'}} label="this question" playbackRate={speed} showProgress onComplete={()=>{setHeard(current.id);setAudioFailed(false);}} onFailure={()=>{setAudioFailed(true);setHeard('');}}/><label className="number-speed">Playback speed<select value={speed} onChange={e=>setSpeed(Number(e.target.value))}><option value={1}>Normal · 1×</option><option value={.8}>Slow · 0.8×</option></select></label></div>
    {feedback===undefined?<form className="number-answer-form" onSubmit={e=>{e.preventDefault();submit();}}><label htmlFor="number-answer">Your answer in digits</label><input id="number-answer" value={answer} onChange={e=>{setAnswer(e.target.value);setError('');}} inputMode={mode==='prices'?'decimal':undefined} maxLength={40} autoComplete="off" aria-describedby="number-answer-help" aria-invalid={Boolean(error)}/><p id="number-answer-help">{audioFailed?'Audio failed. Retry above; this answer has not been scored.':heard===current.id?'Ready to check.':'Listen to the full clip to unlock Check answer.'}</p><button className="number-primary" type="submit" disabled={heard!==current.id||audioFailed||!answer.trim()}>Check answer</button></form>:<div className="number-feedback" role="status"><p className={numberAnswerCorrect(active,feedback)?'number-correct':'number-incorrect'}>{numberAnswerCorrect(active,feedback)?'Correct':'Not quite — the answer is:'}</p><strong>{mode==='prices'?'¥':''}{current.value}</strong><p className="number-feedback-hanzi" lang="zh-Hans">{current.hanzi}</p><p>{current.pinyin}</p>{!numberAnswerCorrect(active,feedback)&&<><p className="number-feedback-note">Your answer: {active.answers[feedback]}</p><details className="number-reading-notes"><summary>Why this reading?</summary><p>{current.explanation}</p></details></>}<button className="number-primary" type="button" onClick={next}>{isNumberComplete(active)?'See my results →':'Next question →'}</button></div>}
    </>}
   {error&&<p className="number-error" role="alert">{error}</p>}<p className="number-storage-note">Progress stays in this browser.</p>
  </section>}
  <p className={!notice||notice==='Reading updated.'?'sr-only':'number-status'} role="status">{notice}</p>{storageNotice&&<p className="number-error" role="status">{storageNotice}</p>}
 </div>;
}
