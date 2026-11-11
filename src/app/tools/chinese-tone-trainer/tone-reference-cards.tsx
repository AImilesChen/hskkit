"use client";

import { AudioPlaybackControl } from '@/app/components/audio-playback-control';
import { TONE_GUIDES } from '@/lib/tones/learning';
import ToneContour from './tone-contour';

export default function ToneReferenceCards() {
  return <>
    <div className="tone-reference-grid tone-reference-cards">{TONE_GUIDES.map(({ tone, name, hint, item }) => <article className={`tone-reference tone-colour-${tone}`} key={tone}>
      <span className="tone-number">Tone {tone}</span><h3>{name}</h3>
      <ToneContour tone={tone} />
      <div className="tone-example-heading"><strong lang="zh-Hans">{item.hanzi}</strong><div><p className="tone-pinyin">{item.pinyin}</p><p>{item.meaning}</p></div>
        <AudioPlaybackControl asset={{ id:item.id, src:item.audioSrc, sourceLabel:'Synthesized pronunciation' }} variant="icon" label={`Play tone ${tone} example`} />
      </div>
      <p className="tone-listen-hint">{hint}</p>
    </article>)}</div>
    <p className="tone-diagram-note">The lines are pitch-direction guides, not measurements of these recordings. For tone 3, the dashed rise may be absent; listen for its low part.</p>
  </>;
}
