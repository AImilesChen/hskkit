"use client";

import Link from 'next/link';
import type { ReactNode } from 'react';
import HomeIcon, { type HomeIconName } from './home-icon';
import { todayStageCopy, type WorkspaceItem, type todaySessionRecap, type todayTaskPreview } from '@/lib/learning/today-workspace';

type Preview = ReturnType<typeof todayTaskPreview>;
export type TodayRecapWord = ReturnType<typeof todaySessionRecap>[number];
export type TodaySummaryData = {
  completed: number; total: number; moved: number; stagesDone: number; stagesTotal: number;
  words: number; reviews: number; listening: number; practice: number; practiceAnswers: number;
};
export type TodaySupportData = {
  words: TodayRecapWord[]; hidden: boolean; openMistakes: number; listeningPlanned: number; level: number;
  saveText: string; onAdjust: () => void;
};

export function TodayTaskPreview({ item, preview, ready = false, action }: { item: WorkspaceItem; preview: Preview; ready?: boolean; action?: ReactNode }) {
  const copy = item.kind === 'listen' ? {
    title: item.dimension === 'context_audio' ? 'Understand it in a sentence.' : 'Connect the sound to the meaning.',
    description: item.dimension === 'context_audio' ? 'Listen for a word inside a short Chinese sentence, then check your understanding.' : 'Recognise the spoken word without relying on its written form.',
    steps: [['headphones','Listen first','Play the recording before choosing an answer.'],['target','Choose from memory','Use what you heard to answer the question.'],['check','Check and continue','Read the feedback and save your result.']],
  } : item.kind === 'practice' ? {
    title: 'Put your vocabulary to work.',
    description: 'Practise word recognition and meaning in a short set for your selected level.',
    steps: [['pencil','Answer a question','Choose the answer that fits the prompt.'],['check','Check the feedback','Read the explanation before moving on.'],['file','Save your results','Finish the set to update this Today step.']],
  } : item.kind === 'review' ? {
    title: 'Bring familiar words back to mind.',description:'Revisit the cards saved in this plan and record how well you remember them.',
    steps:[['review','Recall first','Think of the answer before checking.'],['check','Check your recall','Compare your answer with the saved card.'],['calendar','Record a rating','Your rating sets the next review time.']],
  } : {
    title: 'Make this word stick.',description:'Read its meaning, explore the available pronunciation and example, then check your memory.',
    steps:[['book','Meet the word','Connect its written form and meaning.'],['headphones','Explore its use','Study the available audio and example.'],['check','Check your memory','Recall the meaning without the study notes.']],
  };
  return <article className={`tw-preview tw-kind-${item.kind}`} data-today-item-id={item.id} id={ready ? 'today-active-task' : undefined}>
    <div className="tw-preview-intro"><span className="tw-preview-icon"><HomeIcon name={todayStageCopy[item.kind].icon} /></span><div><p className="tw-eyebrow">{ready ? 'READY TO START' : 'WHAT YOU’LL PRACTISE'}</p><h2>{copy.title}</h2></div></div>
    <p className="tw-preview-description">{copy.description}</p>
    <div className="tw-preview-stats">
      {item.kind === 'listen' ? <>{preview.wordAudio > 0 && <div><strong>{preview.wordAudio}</strong><span>word {preview.wordAudio === 1 ? 'check' : 'checks'}</span></div>}{preview.contextAudio > 0 && <div><strong>{preview.contextAudio}</strong><span>sentence {preview.contextAudio === 1 ? 'check' : 'checks'}</span></div>}</> : <div><strong>{preview.questionCount ?? preview.groupTotal}</strong><span>{preview.questionCount !== undefined ? 'questions in this set' : item.kind === 'practice' ? 'practice task in this stage' : item.kind === 'review' ? 'cards in this stage' : 'words in this stage'}</span></div>}
      <div><strong>{preview.groupMinutes} min</strong><span>for this stage</span></div>
    </div>
    <p className="tw-preview-selected"><strong>Selected task</strong><span>{item.title ?? todayStageCopy[item.kind].title}</span><small>{preview.minutes} min</small></p>
    <ol className="tw-method">{copy.steps.map(([icon,title,description],index) => <li key={title}><span className="tw-method-icon"><HomeIcon name={icon as HomeIconName} /></span><div><h3><span>{index+1}.</span> {title}</h3><p>{description}</p></div></li>)}</ol>
    {ready ? <div className="tw-preview-ready"><p>This opens the recording or question set with your Today progress attached.</p><div className="tw-current-actions" id="today-primary-action">{action}</div></div> : <div className="tw-unlock-note"><HomeIcon name="route" /><div><strong>{preview.earlier ? `Complete ${preview.earlier} earlier ${preview.earlier === 1 ? 'task' : 'tasks'} to unlock this step.` : 'This step follows the current task.'}</strong>{preview.nextTitle && <p>Next to finish: {preview.nextTitle}.</p>}</div></div>}
  </article>;
}

export function TodaySessionSummary({ data, complete, children }: { data: TodaySummaryData; complete: boolean; children?: ReactNode }) {
  const percent=data.total ? Math.round(data.completed/data.total*100) : 0;
  return <article className="tw-summary-panel" id="today-summary" aria-live="polite">
    <p className="tw-eyebrow">{complete ? 'SESSION SAVED' : 'YOUR PROGRESS SO FAR'}</p>
    <h2>{complete ? 'Daily session complete' : 'Your session is taking shape.'}</h2>
    <p className="tw-preview-description">{complete ? 'See what you finished and choose what to revisit next.' : 'This overview updates as you finish each task. Your final report appears when the session ends.'}</p>
    <div className="tw-summary-progress"><div><strong>{data.completed}/{data.total} tasks completed</strong><span>{data.stagesDone}/{data.stagesTotal} stages complete</span></div><div className="tw-progress-track" role="progressbar" aria-label="Session completion" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><span style={{width:`${percent}%`}} /></div>{data.moved>0 && <p>{data.moved} moved to tomorrow · available to restore from the route</p>}</div>
    <div className="tw-result-grid">{([['book',data.words,'Words learned'],['review',data.reviews,'Review cards'],['headphones',data.listening,'Listening checks'],['pencil',data.practice,'Practice tasks']] as const).map(([icon,count,label]) => <div key={label}><HomeIcon name={icon}/><strong>{count}</strong><span>{label}</span></div>)}</div>
    {data.practiceAnswers>0 && <p className="tw-summary-answer-count">{data.practiceAnswers} practice answers recorded in this session.</p>}
    {children}
  </article>;
}

export function TodaySessionSupport({ data, onOpenRecord }: { data: TodaySupportData; onOpenRecord: (id: string) => void }) {
  const resources = [data.openMistakes>0 ? {icon:'pencil' as const,title:'Revisit your mistakes',description:`${data.openMistakes} unresolved ${data.openMistakes===1?'item is':'items are'} available in your mistake list.`,href:'/mistakes'} : data.words.length>0 ? {icon:'book' as const,title:`Explore HSK ${data.level} vocabulary`,description:`You saved ${data.words.length} ${data.words.length===1?'word':'words'} in this session. Keep building recognition with your level’s word list.`,href:`/vocabulary/${data.level}`} : {icon:'book' as const,title:'Find your learning path',description:'Browse guides for pronunciation, characters and HSK study.',href:'/learn'},
    data.listeningPlanned>0 ? {icon:'headphones' as const,title:'Build your ear for tones',description:`Your plan includes ${data.listeningPlanned} listening checks. Try focused tone listening as a separate activity.`,href:'/tools/chinese-tone-trainer'} : {icon:'target' as const,title:'Explore skill practice',description:'Choose a level and practise vocabulary, grammar, reading or listening.',href:'/practice'}];
  return <div className="tw-support">
    <section className="tw-recap" aria-labelledby="today-recap-title"><div className="tw-section-title"><span className="tw-support-icon"><HomeIcon name="book"/></span><div><p className="tw-eyebrow">BUILD ON WHAT YOU LEARN</p><h2 id="today-recap-title">Today’s word recap</h2></div><span className="tw-recap-count">{data.words.length} saved</span></div>
      {data.hidden ? <p className="tw-recap-hidden" role="status"><HomeIcon name="target"/>Word details stay hidden during a memory, listening or practice check. Finish the current check to revisit them.</p> : data.words.length ? <div className="tw-recap-grid">{data.words.map(word=><article className={`tw-recap-word ${word.needsPractice?'tw-recap-retry':''}`} key={word.id}><div><h3 lang="zh-Hans">{word.hanzi}</h3><span>{word.needsPractice ? 'Worth another look' : word.checked ? 'Memory checked' : 'Learning saved'}</span></div><p className="tw-word-pinyin">{word.pinyin}</p><p className="tw-word-meaning">{word.meaning}</p><button type="button" onClick={()=>onOpenRecord(word.id)}>View learning record<HomeIcon name="arrow"/></button></article>)}</div> : <p className="tw-recap-empty">Your completed words will appear here. Finish a word’s memory check to start your recap.</p>}
    </section>
    <section className="tw-consolidate" aria-labelledby="today-consolidate-title"><div className="tw-section-title"><span className="tw-support-icon"><HomeIcon name="route"/></span><div><p className="tw-eyebrow">KEEP IT FAMILIAR</p><h2 id="today-consolidate-title">Useful next steps</h2></div></div><p className="tw-support-description">Optional activities, separate from today’s checklist.</p><div className="tw-resource-grid">{resources.map(resource=><Link className="tw-resource" href={resource.href} key={resource.href}><span className="tw-resource-icon"><HomeIcon name={resource.icon}/></span><div><h3>{resource.title}</h3><p>{resource.description}</p></div><HomeIcon name="arrow"/></Link>)}</div></section>
    <section className="tw-session-help" aria-labelledby="today-help-title"><h2 id="today-help-title">Make Today work for you</h2><div className="tw-help-grid"><article><HomeIcon name="check"/><h3>Keep your progress</h3><p>{data.saveText}</p></article><article><HomeIcon name="timer"/><h3>Adjust your workload</h3><p>Change the time, level and priority. Your completed steps stay saved.</p><button type="button" onClick={data.onAdjust}>Adjust plan<HomeIcon name="arrow"/></button></article><article><HomeIcon name="calendar"/><h3>Pick it up tomorrow</h3><p>Use “Move this step” when you need more time. Select the moved task in your route to restore it.</p></article></div></section>
  </div>;
}
