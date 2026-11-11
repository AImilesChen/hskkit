"use client";

import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import HomeIcon from './home-icon';
import { reviewSourceLabel, restoreIndependentReview, type IndependentReviewSnapshot } from '@/lib/learning/review-workbench';
import type { ReviewEntryIntent, ReviewLevelScope } from '@/lib/learning/review-session';

export function ReviewSourceBar({intent,total,complete,onAdjust}:{intent:ReviewEntryIntent;total:number;complete:boolean;onAdjust:()=>void}){
  return <section className="rv-source" aria-label="Review source"><div className="rv-source-name"><span><HomeIcon name={intent.kind==='today'?'calendar':intent.kind==='mistake'?'pencil':'review'}/></span><div><strong>{reviewSourceLabel(intent)}{total>0&&` · ${total} ${total===1?'card':'cards'}`}</strong><p>{intent.kind==='today'?'Part of your saved Today plan. Continue from your latest submitted card.':intent.kind==='mistake'?'Retry the saved question, then return to your mistake list.':intent.kind==='word'?'Recall this saved word and choose its next review time.':total>0?'A separate round from the scope you selected. Submitted reviews stay saved.':'Choose your scope and session size, or continue today’s planned review.'}</p></div></div><div className="rv-source-actions">{intent.kind==='setup'&&total>0&&!complete&&<button type="button" className="rv-link-button" onClick={onAdjust}>Adjust session</button>}<Link className="rv-return" href={intent.kind==='mistake'?'/mistakes':'/today'}>{intent.kind==='mistake'?'Back to Mistakes':'Back to Today'}<HomeIcon name="arrow"/></Link></div></section>;
}

export function ReviewTodayShortcut({remaining,completed,total,children}:{remaining:number;completed:number;total:number;children:ReactNode}){
  return <section className="rv-today-shortcut" aria-label="Today review shortcut"><span className="rv-shortcut-icon"><HomeIcon name="calendar"/></span><div><p className="rv-eyebrow">YOUR DAILY PLAN</p><h2>{completed?'Continue today’s review':'Start today’s review'}</h2><p>{remaining} {remaining===1?'card':'cards'} left · {completed}/{total} completed in today’s review</p></div><div className="rv-shortcut-action">{children}</div></section>;
}

export function ReviewOverview({current,due,future}:{current:number;due:number;future:number}){
  return <section className="rv-overview" aria-label="Your review schedule"><div><HomeIcon name="book"/><span>Current level due</span><strong>{current}</strong></div><div><HomeIcon name="review"/><span>All levels due</span><strong>{due}</strong></div><div><HomeIcon name="calendar"/><span>Scheduled for later</span><strong>{future}</strong></div></section>;
}

const ROUND_KEY='hskkit_independent_review_v1';
export function IndependentReviewMemory({binding,cards,ids,completed,level,size,difficult,onRestore}:{binding:string;cards:readonly {id:string;revision:number}[];ids:string[]|null;completed:number;level:ReviewLevelScope;size:5|10|20;difficult:boolean;onRestore:(snapshot:IndependentReviewSnapshot)=>void}){
  const [saved,setSaved]=useState<IndependentReviewSnapshot|null>(null);
  const [notice,setNotice]=useState('');
  const initialized=useRef('');
  const roundToken=useRef('');
  useEffect(()=>{
    if(initialized.current===binding)return;
    initialized.current=binding;
    try{
      const raw=localStorage.getItem(ROUND_KEY);
      const snapshot=restoreIndependentReview(raw,binding,cards);
      setSaved(snapshot);
      const requested=new URLSearchParams(window.location.search).get('round');
      if(snapshot&&requested===snapshot.token){roundToken.current=snapshot.token;onRestore(snapshot);}
      else if(requested)setNotice('This saved round has changed or expired. Choose a new session below.');
    }catch{setNotice('Submitted reviews stay saved. This browser cannot restore an unfinished independent round.');}
  },[binding,cards,onRestore]);
  useEffect(()=>{
    if(initialized.current!==binding||!ids?.length)return;
    try{
      if(!roundToken.current||new URLSearchParams(window.location.search).get('round')!==roundToken.current)roundToken.current=crypto.randomUUID();
      const revisions=Object.fromEntries(ids.map(id=>[id,cards.find(card=>card.id===id)?.revision]));
      if(Object.values(revisions).some(revision=>!Number.isInteger(revision)))return;
      const snapshot={version:1 as const,binding,token:roundToken.current,updatedAt:Date.now(),ids,completed,revisions:revisions as Record<string,number>,level,size,difficult};
      localStorage.setItem(ROUND_KEY,JSON.stringify(snapshot));setSaved(snapshot);
      const url=new URL(window.location.href);url.searchParams.set('round',snapshot.token);window.history.replaceState({},'',`${url.pathname}${url.search}${url.hash}`);
    }catch{setNotice('Submitted reviews stay saved. This browser cannot restore an unfinished independent round.');}
  },[binding,cards,ids,completed,level,size,difficult]);
  if(ids)return notice?<p className="rv-note" role="status">{notice}</p>:null;
  return <>{notice&&<p className="rv-note" role="status">{notice}</p>}{saved&&saved.completed<saved.ids.length&&<section className="rv-resume"><div><h2>Resume your independent review</h2><p>{saved.completed}/{saved.ids.length} cards finished in this browser.</p></div><button type="button" className="rv-secondary" onClick={()=>{roundToken.current=saved.token;onRestore(saved);}}>Resume review<HomeIcon name="arrow"/></button></section>}</>;
}
