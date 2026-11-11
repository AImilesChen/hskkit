"use client";

import Link from 'next/link';
import { useState } from 'react';
import HomeIcon, { type HomeIconName } from './home-icon';
import { reviewGradeOptions, type ReviewGrade } from '@/lib/learning/review-session';

const routes: Array<{title:string;icon:HomeIconName;tone:string;description:string;label:string;href:string}> = [
  {title:'Short skill practice',icon:'pencil',tone:'amber',description:'Answer a short set of questions. Completed answers create review cards; mistakes are ready to revisit immediately.',label:'Choose a practice set',href:'/practice'},
  {title:'Listening practice',icon:'headphones',tone:'teal',description:'Work from a recording, then check your answer. Saved listening cards let you return to the original sound.',label:'Explore listening',href:'/listen'},
  {title:'Vocabulary flashcards',icon:'book',tone:'blue',description:'Try recalling a word before revealing its meaning. Sign in to add words marked “Practice again” to Review.',label:'Try word recall',href:''},
];

function ReviewExample() {
  const [revealed,setRevealed]=useState(false);
  const [rating,setRating]=useState<ReviewGrade|null>(null);
  const options=reviewGradeOptions(2.5,1);
  const selected=options.find(option=>option.grade===rating);
  return <section className="rv-example" id="review-example" aria-labelledby="review-example-title">
    <header><span className="rv-example-label"><HomeIcon name="review"/>INTERACTIVE EXAMPLE</span><span className="rv-example-level">HSK 1</span></header>
    <ol className="rv-example-steps" aria-label="Example steps">
      {['Recall','Check','Rate'].map((step,index)=><li key={step} aria-current={(!revealed?0:!rating?1:2)===index?'step':undefined}><span>{index+1}</span>{step}</li>)}
    </ol>
    <div className="rv-example-word"><span lang="zh-Hans">爱</span><span>ài</span></div>
    <h3 id="review-example-title">What does this word mean?</h3>
    {!revealed ? <><p className="rv-example-prompt">Try remembering it before checking.</p><button type="button" className="rv-primary" onClick={()=>setRevealed(true)}>Reveal meaning<HomeIcon name="arrow"/></button></> : <div aria-live="polite">
      <div className="rv-example-answer"><strong>to love; to like</strong><p lang="zh-Hans">我爱我的家。</p><p>I love my family.</p></div>
      {!selected ? <><p className="rv-example-prompt">How well did you remember it?</p><div className="rv-example-ratings">{options.map(option=><button type="button" key={option.grade} onClick={()=>setRating(option.grade)}><strong>{option.label}</strong><span>{option.hint}</span></button>)}</div></> : <div className="rv-example-result" role="status"><HomeIcon name="check"/><div><strong>{selected.label} · {selected.hint}</strong><p>That is the next interval for this example. Real cards use their saved review history.</p></div></div>}
      <button className="rv-example-reset" type="button" onClick={()=>{setRevealed(false);setRating(null);}}>Try the example again</button>
    </div>}
    <p className="rv-example-caption">Example only · nothing is added to your review list.</p>
  </section>;
}

export default function ReviewOnboarding({level,account}:{level:number;account:boolean}) {
  return <div className="rv-onboarding">
    <section className="rv-welcome" aria-labelledby="review-welcome-title">
      <div className="rv-welcome-copy"><span className="rv-welcome-badge"><HomeIcon name="book"/>Your review list starts here</span><h2 id="review-welcome-title">Learn it today.<br/><span>Remember it tomorrow.</span></h2><p>Bring back the words and questions you have already studied. A short review helps you notice what feels familiar and what needs another look.</p><div className="rv-welcome-actions"><Link className="rv-primary" href="/today">Start with today’s plan<HomeIcon name="arrow"/></Link><a href="#review-example" className="rv-welcome-example-link">Try the example<HomeIcon name="review"/></a></div><p className="rv-welcome-note"><HomeIcon name="check"/>{account ? "Complete your first task to start this account’s review list." : "Start as a guest. Your completed work stays in this browser."}</p><div className="rv-welcome-path" aria-label="Learning and review cycle"><span><HomeIcon name="book"/>Learn</span><HomeIcon name="arrow"/><span><HomeIcon name="review"/>Recall</span><HomeIcon name="arrow"/><span><HomeIcon name="calendar"/>Return</span></div></div>
      <ReviewExample/>
    </section>
    <section className="rv-how" aria-labelledby="review-how-title"><header><p className="rv-eyebrow">FROM FIRST ANSWER TO NEXT REVIEW</p><h2 id="review-how-title">How your review list grows</h2></header><ol>
      <li><span className="rv-how-icon rv-blue"><HomeIcon name="book"/></span><div><span className="rv-step-number">01 · LEARN</span><h3>Start with something real.</h3><p>Complete a learning task, a practice answer or a listening question. Your saved work gives Review something to bring back.</p></div></li>
      <li><span className="rv-how-icon rv-purple"><HomeIcon name="review"/></span><div><span className="rv-step-number">02 · RECALL</span><h3>Give memory a chance.</h3><p>Answer the saved question or recall the word before revealing it. Check the explanation when you need it.</p></div></li>
      <li><span className="rv-how-icon rv-green"><HomeIcon name="calendar"/></span><div><span className="rv-step-number">03 · RETURN</span><h3>Come back when it is due.</h3><p>Memory ratings help set the next review time. Missed questions stay available for correction.</p></div></li>
    </ol></section>
    <section className="rv-starting-points" aria-labelledby="review-starting-title"><header><p className="rv-eyebrow">CHOOSE A STARTING POINT</p><h2 id="review-starting-title">A few useful ways to begin</h2><p>Today gives you a guided route. These activities let you choose your own focus.</p></header><div className="rv-starting-grid">{routes.map(route=><article key={route.title} className={`rv-starting-card rv-${route.tone}`}><span className="rv-starting-icon"><HomeIcon name={route.icon}/></span><h3>{route.title}</h3><p>{route.description}</p><Link href={route.href||`/vocabulary/${level}?mode=flashcards#vocabulary-activities`}>{route.label}<HomeIcon name="arrow"/></Link></article>)}</div></section>
    <section className="rv-first-help" aria-label="Before your first review"><article><HomeIcon name="search"/><div><h2>Already studied, but your list is empty?</h2><p>{account?'No review cards have been created in this account yet. Check that you are using the account you studied with.':'Guest progress belongs to the browser you studied in. Use that browser, or sign in to the account that holds your progress.'}</p><Link href="/account">{account?'Check your account':'Sign in to your account'}<HomeIcon name="arrow"/></Link></div></article><article><HomeIcon name="calendar"/><div><h2>When will my first card be ready?</h2><p>A correct practice answer is scheduled for later. A wrong answer can be reviewed immediately. Once cards exist, this page shows your real due counts and session choices.</p><Link href="/mistakes">Find saved mistakes<HomeIcon name="arrow"/></Link></div></article></section>
  </div>;
}
