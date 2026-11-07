"use client";
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {ratePreview,repeatUncertain,shufflePreview} from '@/lib/learning/flashcard-preview';
import {nextStudyBatch,levelLabel,STUDY_KEY,type ComparisonStudy,type ComparisonIndex} from '@/lib/vocabulary-comparison/domain';
import ComparisonAudio from './comparison-audio';

export default function ComparisonStudyPanel({initial,index,onClose}:{initial:ComparisonStudy;index:ComparisonIndex;onClose:(session:ComparisonStudy)=>void}){
 const [session,setSession]=useState(initial),[revealed,setRevealed]=useState(false),[storageNotice,setStorageNotice]=useState('');
 const ids=session.scopeIds.slice(session.offset,session.offset+session.size),preview=session.preview;
 const unit=index.byId.get(ids[preview.order[preview.cursor]]),entry=unit?.updated.find(e=>e.level<=session.targetLevel)??unit?.updated[0];
 const known=Object.values(preview.ratings).filter(value=>value==='known').length;
 const retry=Object.values(preview.ratings).filter(value=>value==='retry').length;
 const remaining=session.scopeIds.length-session.offset-ids.length;
 useEffect(()=>{try{localStorage.setItem(STUDY_KEY,JSON.stringify(session));}catch{setStorageNotice('Progress could not be saved in this browser. You can keep studying during this visit.');}},[session]);
 function stop(){window.dispatchEvent(new CustomEvent('hskkit:comparison-play',{detail:'changing-card'}));}
 function rate(rating:'known'|'retry'){if(!revealed)return;stop();setSession(value=>({...value,preview:ratePreview(value.preview,rating)}));setRevealed(false);}
 return <section className="cmp-study" aria-labelledby="cmp-study-heading" id="comparison-study">
  <div className="cmp-study-top"><div><p className="cmp-eyebrow">Your selected words</p><h2 id="cmp-study-heading">Practise your selected words</h2><p>Old {levelLabel(session.oldLevel)} → new {levelLabel(session.targetLevel)} · {session.scopeIds.length.toLocaleString('en-US')} {session.scopeIds.length===1?'headword':'headwords'} in your filtered list.</p></div><button type="button" className="cmp-secondary" onClick={()=>{stop();onClose(session);}}>Back to comparison</button></div>
  {preview.complete?<div className="cmp-round-complete"><span className="cmp-complete-mark" aria-hidden="true">✓</span><h3>Round complete</h3><div className="cmp-round-stats"><div><strong>{ids.length}</strong><span>Words reviewed</span></div><div><strong>{known}</strong><span>Remembered</span></div><div><strong>{retry}</strong><span>To revisit</span></div></div><p>{remaining?`${remaining.toLocaleString('en-US')} headwords remain after this batch.`:'You have reached the end of this filtered list.'}</p><div className="cmp-button-row">{retry>0&&<button type="button" className="cmp-primary" onClick={()=>{setSession(s=>({...s,preview:repeatUncertain(s.preview)}));setRevealed(false);}}>Revisit {retry} uncertain {retry===1?'word':'words'}</button>}{remaining>0&&<button type="button" className={retry>0?"cmp-secondary":"cmp-primary"} onClick={()=>{setSession(nextStudyBatch(session));setRevealed(false);}}>Next {Math.min(session.size,remaining)} words →</button>}<button type="button" className="cmp-secondary" onClick={()=>{setSession(s=>({...s,preview:{order:ids.map((_,i)=>i),cursor:0,round:1,ratings:{},complete:false}}));setRevealed(false);}}>Repeat this batch</button></div></div>:unit&&<>
   <div className="cmp-study-progress"><span>Card {preview.cursor+1} of {preview.order.length} · {preview.round===1?'First pass':'Revisit'}</span><span>Batch {Math.floor(session.offset/session.size)+1} of {Math.ceil(session.scopeIds.length/session.size)}</span></div>
   <progress max={preview.order.length} value={preview.cursor+1} aria-label="Current recall round"/>
   <div className="cmp-flashcard"><p className="cmp-card-prompt">Recall the meaning before revealing it.</p><strong className="cmp-flashcard-word" lang="zh-Hans">{unit.headword}</strong>
    {revealed?<div className="cmp-revealed"><p className="cmp-pinyin">{entry?.pinyin??unit.glosses[0]?.[0]??'Pinyin not supplied by the old source'}</p><p>{entry?.meaning??unit.glosses[0]?.[1]??'An English definition is not available for this old-only entry.'}</p><p>{entry?`${levelLabel(entry.level)} · ${entry.partOfSpeech}`:'Old-list headword · dictionary enrichment where available'}</p><ComparisonAudio entry={entry}/>{entry&&<p><Link prefetch={false} href={`/word/${encodeURIComponent(entry.id)}`}>Explore this word →</Link></p>}{unit.needsReview&&<div className="cmp-sense-note"><strong>Check readings and meanings</strong><p>This headword has qualified or multiple source entries. This card shows one reading; shared spelling does not establish knowledge of every sense.</p>{unit.updated.filter(e=>e.id!==entry?.id).map(e=><p key={e.id}><span className="cmp-pinyin">{e.pinyin}</span> · {e.meaning} ({levelLabel(e.level)})</p>)}</div>}</div>:<button type="button" className="cmp-primary" onClick={()=>setRevealed(true)}>Reveal meaning</button>}
   </div><div className="cmp-rating-buttons"><button type="button" className="cmp-retry" disabled={!revealed} onClick={()=>rate('retry')}>↻ Again</button><button type="button" className="cmp-known" disabled={!revealed} onClick={()=>rate('known')}>✓ Remembered</button></div>
   <div className="cmp-study-bottom"><p>Uncertain words return once automatically. This is personal recall practice, not an exam score.</p><button type="button" className="cmp-text-button" onClick={()=>{stop();setSession(s=>({...s,preview:shufflePreview(s.preview,Math.random)}));setRevealed(false);}}>Shuffle remaining cards</button></div>
  </>}
  {storageNotice&&<p className="cmp-notice" role="status">{storageNotice}</p>}
 </section>;
}
