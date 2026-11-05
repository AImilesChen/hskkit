"use client";

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { AudioPlaybackControl } from '@/app/components/audio-playback-control';
import { trackEvent } from '@/lib/analytics';
import { TONES, TONE_LABELS, TONE_ITEMS, createToneSession, answerToneSession, isToneComplete, mergeToneHistory, parseToneHistory, retryToneMistakes, toneAnswer, toneItem, toneSessionReport, type Tone, type ToneMode, type ToneSession } from '@/lib/tones/domain';

const GUEST_KEY = 'hskkit:tone-training:v1:guest';
const localRead = (key: string) => { try { return parseToneHistory(JSON.parse(localStorage.getItem(key) ?? '[]')); } catch { return []; } };
type SyncProfile = { scope: 'guest' | 'account'; profile?: string; sessions?: ToneSession[] };
const modes = [
  { id: 'learn', number: '01', title: 'Meet the tones', text: 'Listen, compare and get familiar.', detail: 'Guided · No score' },
  { id: 'single', number: '02', title: 'Single syllables', text: 'Hear a sound. Find its tone.', detail: 'Listen · Choose 1–4' },
  { id: 'double', number: '03', title: 'Tone pairs', text: 'Catch the tones in a real word.', detail: 'Listen · Choose both tones' },
] as const;
const reference = ['八', '茶', '买', '爱'].map(hanzi => TONE_ITEMS.find(i => i.hanzi === hanzi)!);
function ToneChoices({ value, onChange, label, disabled }: { value: string; onChange: (tone: string) => void; label: string; disabled: boolean }) {
  return <fieldset className="tone-choices" disabled={disabled}><legend>{label}</legend><div>{TONES.map(tone => <button key={tone} type="button" aria-pressed={value === String(tone)} onClick={() => onChange(String(tone))}><strong>{tone}</strong><span>{TONE_LABELS[tone]}</span></button>)}</div></fieldset>;
}
function sound(item: typeof TONE_ITEMS[number]) { return { id: item.id, src: item.audioSrc, sourceLabel: 'Synthesized pronunciation' as const }; }

export default function ToneTrainer() {
  const [mode, setMode] = useState<'learn' | ToneMode>('single');
  const [size, setSize] = useState<10 | 20>(10);
  const [history, setHistory] = useState<ToneSession[]>([]);
  const [activeId, setActiveId] = useState<string>();
  const [guided, setGuided] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [profile, setProfile] = useState<SyncProfile>({ scope: 'guest' });
  const [storageKey, setStorageKey] = useState(GUEST_KEY);
  const [syncNote, setSyncNote] = useState('Checking saved practice…');
  const [storageNote, setStorageNote] = useState('');
  const [hasGuestPractice, setHasGuestPractice] = useState(false);
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');
  const [listened, setListened] = useState('');
  const [feedbackIndex, setFeedbackIndex] = useState<number | null>(null);
  const [audioFailed, setAudioFailed] = useState(false);
  const historyRef = useRef(history);
  const savedBody = useRef('');
  const requestGeneration = useRef(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const hasNavigated = useRef(false);
  historyRef.current = history;
  const active = history.find(s => s.id === activeId);
  const resumed = history.find(s => !isToneComplete(s));
  const currentQuestionId = active?.order[feedbackIndex ?? active.answers.length];
  useEffect(() => { setFirst(''); setSecond(''); setListened(''); setAudioFailed(false); }, [activeId, currentQuestionId]);

  useEffect(() => {
    if (!hasNavigated.current && !activeId && !guided) return;
    hasNavigated.current = true;
    headingRef.current?.focus({ preventScroll: true });
    headingRef.current?.closest('section')?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }, [activeId, guided, feedbackIndex]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    async function load() {
      let incoming: SyncProfile = { scope: 'guest' };
      let unavailable = false;
      try {
        const response = await fetch('/api/v1/tone-training', { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) throw new Error('unavailable');
        incoming = await response.json() as SyncProfile;
      } catch { unavailable = true; }
      if (cancelled) return;
      const key = incoming.scope === 'account' && incoming.profile ? `hskkit:tone-training:v1:${incoming.profile}` : GUEST_KEY;
      const cached = localRead(key);
      const merged = mergeToneHistory(parseToneHistory(incoming.sessions), cached);
      setProfile(incoming); setStorageKey(key); setHistory(merged);
      setHasGuestPractice(incoming.scope === 'account' && localRead(GUEST_KEY).length > 0);
      setSyncNote(unavailable ? 'Account sync is unavailable. You can still practise in this browser.' : incoming.scope === 'account' ? 'Account practice loaded.' : 'Saved in this browser. No account needed.');
      setHydrated(true);
    }
    let cancelled = false;
    void load();
    return () => { cancelled = true; clearTimeout(timer); controller.abort(); };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(storageKey, JSON.stringify(history)); setStorageNote(''); }
    catch { setStorageNote('Browser storage is unavailable. Keep this page open to retain your current practice.'); }
    if (profile.scope !== 'account' || !history.length) return;
    const body = JSON.stringify({ sessions: history, profile: profile.profile });
    if (body === savedBody.current) return;
    const generation = ++requestGeneration.current;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSyncNote('Saving to your account…');
      const timeout = setTimeout(() => controller.abort(), 8000);
      try {
        const response = await fetch('/api/v1/tone-training', { method: 'POST', headers: { 'content-type': 'application/json' }, body, signal: controller.signal });
        if (!response.ok) {
          const data = await response.json() as { error?: string };
          if (data.error === 'ACCOUNT_CHANGED') { setSyncNote('Account changed. Reload this page before syncing. Your browser copy is kept.'); return; }
          throw new Error('sync');
        }
        if (generation === requestGeneration.current) { savedBody.current = body; setSyncNote('Saved to your account and this browser.'); }
      } catch { if (generation === requestGeneration.current) setSyncNote('Account sync paused. Your browser copy is kept; use Retry sync.'); }
      finally { clearTimeout(timeout); }
    }, 500);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [history, hydrated, storageKey, profile.scope, profile.profile]);

  useEffect(() => {
    function otherTab(event: StorageEvent) { if (event.key === storageKey) setHistory(current => mergeToneHistory(localRead(storageKey), current)); }
    window.addEventListener('storage', otherTab);
    return () => window.removeEventListener('storage', otherTab);
  }, [storageKey]);

  function resetQuestion() { setFirst(''); setSecond(''); setListened(''); setFeedbackIndex(null); setAudioFailed(false); }
  function open(session: ToneSession) { setActiveId(session.id); setGuided(false); resetQuestion(); headingRef.current?.focus(); }
  function start(nextMode: ToneMode = mode === 'double' ? 'double' : 'single', focus?: Tone[]) {
    const session = createToneSession(nextMode, size, { focus });
    setHistory(current => mergeToneHistory(current, [session])); open(session);
    trackEvent('tone_training_start', { mode: nextMode, size: session.order.length, focused: Boolean(focus) });
  }
  function check() {
    if (!active || feedbackIndex !== null) return;
    const index = active.answers.length;
    const id = active.order[index];
    if (!id || listened !== id || !first || (active.mode === 'double' && !second)) return;
    const updated = answerToneSession(active, id, active.mode === 'double' ? `${first}-${second}` : first, true);
    setHistory(current => mergeToneHistory(current, [updated])); setFeedbackIndex(index);
    if (isToneComplete(updated)) trackEvent('tone_training_complete', { mode: updated.mode, size: updated.order.length, retry: Boolean(updated.retryOf) });
  }
  function retry() {
    if (!active) return;
    const session = retryToneMistakes(active);
    if (session) { setHistory(current => mergeToneHistory(current, [session])); open(session); trackEvent('tone_training_retry', { mode: session.mode, size: session.order.length }); }
  }
  const storageMessage = <div className="tone-save-note" role="status"><p>{syncNote}</p>{storageNote && <p>{storageNote}</p>}{syncNote.includes('Retry sync') && <button type="button" onClick={() => { savedBody.current = ''; setHistory(current => [...current]); }}>Retry sync</button>}{hasGuestPractice && <button type="button" onClick={() => { setHistory(current => mergeToneHistory(current, localRead(GUEST_KEY))); setHasGuestPractice(false); }}>Bring this browser’s guest practice into my account</button>}</div>;
  // Keep a single active sound within this tool, including guided comparison.
  function solo(event: React.SyntheticEvent) { const current = event.target; document.querySelectorAll<HTMLAudioElement>('.tone-tool audio').forEach(audio => { if (audio !== current) audio.pause(); }); }
  const leave = () => { setActiveId(undefined); setGuided(false); resetQuestion(); };

  if (guided) return <div className="tone-tool" onPlayCapture={solo}><section className="tone-guided"><p className="tone-eyebrow">Listen without a score</p><h2 tabIndex={-1} ref={headingRef}>Get to know the four tones.</h2><p>Compare the direction of the sound. The third tone often stays low in connected speech.</p><div className="tone-reference-grid">{reference.map((item, index) => <article className={`tone-reference tone-colour-${index + 1}`} key={item.id}><span className="tone-number">Tone {index + 1}</span><h3>{TONE_LABELS[(index + 1) as Tone]}</h3><strong lang="zh-Hans">{item.hanzi}</strong><p className="tone-pinyin">{item.pinyin}</p><AudioPlaybackControl asset={sound(item)} variant="icon" label={`Play tone ${index + 1} example`} /><p>{item.meaning}</p></article>)}</div><div className="tone-actions"><button className="tone-primary" onClick={() => start('single')}>Try single syllables →</button><button className="tone-secondary" onClick={leave}>Choose a mode</button></div><p className="tone-small">Guided listening does not change your scored practice results.</p></section>{storageMessage}</div>;

  if (active && isToneComplete(active) && feedbackIndex === null) {
    const report = toneSessionReport(active);
    const missed = active.order.filter((id, i) => toneAnswer(toneItem(id)!) !== active.answers[i]);
    return <div className="tone-tool" onPlayCapture={solo}><section className="tone-results"><p className="tone-eyebrow">{active.retryOf ? 'Mistake practice · Separate result' : 'First-pass result'}</p><div className="tone-result-heading"><div><h2 tabIndex={-1} ref={headingRef}>{report.correct} of {report.total} words correct.</h2><p>{active.mode === 'double' ? 'Both syllables must be correct for a word to count.' : 'Your first checked answer counts for each sound.'}</p></div><strong className="tone-score">{report.percent}<small>%</small></strong></div><div className="tone-actions">{missed.length > 0 && <button className="tone-primary" onClick={retry}>Practise {missed.length} missed {missed.length === 1 ? 'word' : 'words'} →</button>}<button className={missed.length ? 'tone-secondary' : 'tone-primary'} onClick={() => start(active.mode)}>Try a fresh round</button><button className="tone-text-button" onClick={leave}>Choose a mode</button></div>
      <h3>Your tone breakdown</h3><p className="tone-small">Counts are syllables, not words. A short round is practice feedback, not a proficiency assessment.</p><div className="tone-breakdown">{report.byTone.map(row => <div key={row.tone}><span>Tone {row.tone}</span><strong>{row.total ? `${row.correct}/${row.total}` : 'Not practised'}</strong><small>{TONE_LABELS[row.tone]}</small></div>)}</div>
      {active.mode === 'double' && <p className="tone-position-note">First syllable: {report.positions[0].correct}/{report.positions[0].total} · Second syllable: {report.positions[1].correct}/{report.positions[1].total}</p>}
      {report.confusions.length > 0 && <section className="tone-focus"><h3>A useful next step</h3>{report.confusions.slice(0, 2).map(row => <div key={`${row.expected}-${row.heard}`}><p>You heard tone {row.heard} instead of tone {row.expected}: <strong>{row.count} {row.count === 1 ? 'time' : 'times'}</strong>.</p><button className="tone-text-button" onClick={() => start('single', [row.expected, row.heard])}>Practise tones {row.expected} and {row.heard} →</button></div>)}</section>}
      <h3>Review this round</h3><ul className="tone-review-list">{active.order.map((id, i) => { const item = toneItem(id)!; const correct = toneAnswer(item) === active.answers[i]; return <li key={id}><span className={correct ? 'tone-correct' : 'tone-incorrect'}>{correct ? 'Correct' : 'Review'}</span><div><Link href={item.wordHref} lang="zh-Hans" className="tone-review-hanzi">{item.hanzi}</Link><p className="tone-pinyin">{item.pinyin}</p><p>You chose {active.answers[i].replace('-', ' + ')} · Correct: {item.tones.join(' + ')}</p></div><AudioPlaybackControl asset={sound(item)} variant="icon" label={`Replay ${item.hanzi}`} /></li>; })}</ul><p className="tone-small">{active.retryOf ? 'This retry does not replace your original result.' : 'Mistake practice is saved separately from this first-pass result.'}</p></section>{storageMessage}</div>;
  }

  if (active) {
    const index = feedbackIndex ?? active.answers.length;
    const item = toneItem(active.order[index])!;
    const checked = feedbackIndex !== null;
    const correct = checked && active.answers[index] === toneAnswer(item);
    return <div className="tone-tool" onPlayCapture={solo}><section className="tone-practice"><div className="tone-practice-top"><span>{active.retryOf ? 'Mistake practice' : active.mode === 'single' ? 'Single syllables' : 'Tone pairs'}{active.focus ? ` · Tones ${active.focus.join(' & ')}` : ''}</span><span>{index + 1} / {active.order.length}</span></div><progress value={index} max={active.order.length} aria-label="Practice progress" /><div className="tone-listen-area"><p className="tone-eyebrow">Listen first. Trust your ear.</p><h2 tabIndex={-1} ref={headingRef}>{active.mode === 'single' ? 'Which tone do you hear?' : 'Which two tones do you hear?'}</h2><div className="tone-player"><AudioPlaybackControl key={item.id} asset={sound(item)} variant="icon" label="the practice sound" onComplete={() => setListened(item.id)} onFailure={() => { setListened(''); setAudioFailed(true); }} /></div><p className="tone-small" aria-live="polite">{checked ? 'Replay the sound, or continue when you’re ready.' : audioFailed && listened !== item.id ? 'Audio could not play. Retry above; no answer has been scored.' : listened === item.id ? 'Choose the tone, then check your answer.' : 'Listen to the complete sound to unlock the choices.'}</p></div>
      {!checked ? <><ToneChoices label={active.mode === 'double' ? 'First syllable' : 'Choose a tone'} value={first} onChange={setFirst} disabled={listened !== item.id} />{active.mode === 'double' && <ToneChoices label="Second syllable" value={second} onChange={setSecond} disabled={listened !== item.id} />}<button className="tone-primary tone-check" disabled={listened !== item.id || !first || (active.mode === 'double' && !second)} onClick={check}>Check answer</button></> : <div className={`tone-feedback ${correct ? 'is-correct' : 'needs-practice'}`} role="status"><strong>{correct ? 'You heard it.' : 'Give this sound another listen.'}</strong><div className="tone-answer"><span lang="zh-Hans">{item.hanzi}</span><div><p className="tone-pinyin">{item.pinyin}</p><p>{item.tones.map(t => `Tone ${t}: ${TONE_LABELS[t]}`).join(' · ')}</p></div></div><p>{item.meaning}</p>{!correct && <p>You chose {active.answers[index].replace('-', ' + ')}. The sound uses {item.tones.join(' + ')}.</p>}<button className="tone-primary" onClick={() => { resetQuestion(); headingRef.current?.focus(); }}>{isToneComplete(active) ? 'See my result →' : 'Next sound →'}</button></div>}
      <button className="tone-text-button tone-leave" onClick={leave}>Back to modes · Keep my progress</button></section>{storageMessage}</div>;
  }

  return <div className="tone-tool" onPlayCapture={solo}><section className="tone-setup" aria-labelledby="tone-mode-heading"><div className="tone-section-heading"><div><p className="tone-eyebrow">A little listening. A clearer sound.</p><h2 id="tone-mode-heading" ref={headingRef} tabIndex={-1}>Where would you like to start?</h2></div><span className="tone-free">Free · No sign-up</span></div><div className="tone-mode-grid">{modes.map(item => <button key={item.id} className={`tone-mode-card ${mode === item.id ? 'is-selected' : ''}`} aria-pressed={mode === item.id} onClick={() => setMode(item.id)}><span className="tone-mode-number">{item.number}</span><strong>{item.title}</strong><span>{item.text}</span><small>{item.detail}</small></button>)}</div><div className="tone-start-row">{mode !== 'learn' && <fieldset className="tone-size"><legend>Your round</legend>{[10, 20].map(n => <button key={n} aria-pressed={size === n} onClick={() => setSize(n as 10 | 20)}>{n} sounds</button>)}</fieldset>}<button className="tone-primary" disabled={!hydrated} onClick={() => mode === 'learn' ? setGuided(true) : start()}>{!hydrated ? 'Loading practice…' : mode === 'learn' ? 'Explore the four tones →' : 'Start listening →'}</button></div>{resumed && <div className="tone-resume"><div><strong>Your practice is waiting.</strong><p>{resumed.mode === 'single' ? 'Single syllables' : 'Tone pairs'} · {resumed.answers.length} of {resumed.order.length} checked{resumed.retryOf ? ' · Mistake practice' : ''}</p></div><button className="tone-secondary" onClick={() => open(resumed)}>Continue my round →</button></div>}{storageMessage}</section>
    <section className="tone-reference-intro"><div><p className="tone-eyebrow">A quick reminder</p><h2>Four tones. Four directions.</h2><p>Listen for how the pitch moves, rather than how high the speaker’s voice is.</p></div><button className="tone-text-button" onClick={() => setGuided(true)}>Hear the examples →</button></section><div className="tone-mini-reference">{TONES.map((tone, index) => <div className={`tone-colour-${tone}`} key={tone}><strong>{['ā', 'á', 'ǎ', 'à'][index]}</strong><span>Tone {tone}<small>{TONE_LABELS[tone]}</small></span></div>)}</div>
    {history.some(isToneComplete) && <section className="tone-history"><h2>Your recent practice</h2><ul>{history.filter(isToneComplete).slice(0, 4).map(s => <li key={s.id}><span>{s.mode === 'single' ? 'Single syllables' : 'Tone pairs'}{s.retryOf ? ' · Retry' : ' · First pass'}</span><strong>{toneSessionReport(s).percent}%</strong><button className="tone-text-button" onClick={() => open(s)}>View result →</button></li>)}</ul></section>}</div>;
}
