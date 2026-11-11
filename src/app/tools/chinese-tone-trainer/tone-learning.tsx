"use client";

import Link from 'next/link';
import { AudioPlaybackControl } from '@/app/components/audio-playback-control';
import { TONE_CONTRASTS } from '@/lib/tones/learning';

export default function ToneLearning() {
  function solo(event: React.SyntheticEvent) {
    document.querySelectorAll<HTMLAudioElement>('.tone-page audio').forEach(audio => { if (audio !== event.target) audio.pause(); });
  }
  return <div className="tone-learning" onPlayCapture={solo}>
    <section className="tone-contrast-section" id="compare-tones" aria-labelledby="tone-contrast-title">
      <div className="tone-learning-heading"><p className="tone-eyebrow">SAME SYLLABLE. DIFFERENT TONE.</p><h2 id="tone-contrast-title">Put two sounds side by side.</h2><p>Keep the syllable the same and compare how the pitch moves. Play A, then B, and switch between them as often as you like. These comparisons are unscored.</p></div>
      <div className="tone-contrast-grid">{TONE_CONTRASTS.map(pair => <article className="tone-contrast-card" key={pair.id} data-tone-contrast={pair.id}>
        <p className="tone-pair-label">TONE {pair.tones[0]} / TONE {pair.tones[1]}</p><h3>{pair.name}</h3>
        <div className="tone-contrast-sounds">{pair.items.map((item,index) => <div className={`tone-contrast-sound tone-colour-${item.tones[0]}`} key={item.id}>
          <span className="tone-ab-label">{index === 0 ? 'A' : 'B'} · Tone {item.tones[0]}</span><strong lang="zh-Hans">{item.hanzi}</strong><p className="tone-pinyin">{item.pinyin}</p><p className="tone-contrast-meaning">{item.meaning}</p>
          <AudioPlaybackControl asset={{id:item.id,src:item.audioSrc,sourceLabel:'Synthesized pronunciation'}} variant="icon" label={`Play ${index === 0 ? 'A' : 'B'}: ${item.pinyin}`} />
        </div>)}</div><p className="tone-contrast-hint">{pair.hint}</p>
      </article>)}</div>
      <p className="tone-diagram-note">Start with these three contrasts, then try a listening round. The examples do not cover every syllable or tone contrast.</p>
    </section>

    <section className="tone-guide-section" aria-labelledby="tone-method-title">
      <div className="tone-learning-heading"><p className="tone-eyebrow">MAKE THE NEXT ROUND MORE USEFUL</p><h2 id="tone-method-title">How to practise Mandarin tones</h2><p>Use the sounds to check what you hear. Then use the feedback to decide what to listen for next.</p></div>
      <div className="tone-method-grid">
        <article><span className="tone-method-number">01</span><h3>Follow the pitch, not the volume.</h3><p>A louder recording does not necessarily have a higher tone. Listen for whether the voice stays level, rises, stays low or falls. Use the four-tone cards as a reminder, then try a single-syllable round without looking at the pinyin.</p></article>
        <article><span className="tone-method-number">02</span><h3>Hear tone 3 as low first.</h3><p>The third-tone mark suggests a dip and rise, but you will not always hear a full rise in speech. Pay attention to the low part. The diagram’s dashed ending shows a possible rise, rather than a movement every recording must contain.</p></article>
        <article><span className="tone-method-number">03</span><h3>Separate tone contrasts from word pairs.</h3><p>The comparison cards keep one syllable constant while its tone changes. A two-syllable round asks you to hear two positions in one word. Listen once to the whole word, then replay while attending to each syllable. Both tones must be correct for the word score.</p></article>
        <article><span className="tone-method-number">04</span><h3>Use a short result as a starting point.</h3><p>After ten or twenty sounds, check which answers you mixed up. Revisit those sounds and try a focused round. A few errors can suggest something worth practising; they are not enough to label a tone as permanently weak or mastered.</p></article>
      </div>
      <div className="tone-routine"><div><p className="tone-eyebrow">YOUR NEXT PRACTICE</p><h3>Listen → choose → check → compare.</h3><p>Start with ten single syllables. Read the feedback, revisit any missed sounds, then move to two-syllable words when you want a different challenge.</p></div><a className="tone-secondary" href="#tone-workbench">Back to the trainer ↑</a></div>
      <p className="tone-teaching-source">Further reading: <a href="https://ocw.mit.edu/courses/res-21g-003-learning-chinese-a-foundation-course-in-mandarin-spring-2011/01af9a25b804b7d58a26fa580691df4f_MITRES_21G_003S11_pinyin.pdf">MIT OpenCourseWare’s pinyin and tone overview</a>. Examples here use HSKKit’s published synthesized audio.</p>
    </section>

    <section className="tone-next-learning" aria-labelledby="tone-next-title"><div><p className="tone-eyebrow">TAKE IT INTO EVERYDAY CHINESE</p><h2 id="tone-next-title">Keep listening beyond the tone marks.</h2><p>These foundation rounds use 48 single-syllable and 48 two-syllable examples. Neutral tones, 一 / 不 changes and consecutive third tones need separate contextual study; they are not tested in this set.</p></div><nav aria-label="Continue learning"><Link href="/blog/chinese-tones-guide">Read the Mandarin tones guide →</Link><Link href="/blog/chinese-pinyin-guide">Understand pinyin →</Link><Link href="/listen">Explore Chinese listening →</Link></nav></section>
  </div>;
}
