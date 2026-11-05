import bank from './bank.json' with { type: 'json' };

export type Tone = 1 | 2 | 3 | 4;
export type ToneMode = 'single' | 'double';
export type ToneItem = { id: string; mode: ToneMode; hanzi: string; pinyin: string; meaning: string; tones: Tone[]; audioSrc: string; wordHref: string; sourceAssetId: string; audioSource: string };
export const TONE_BANK_VERSION = bank.version;
export const TONE_ITEMS = bank.items as ToneItem[];
export const TONES = [1, 2, 3, 4] as const;
export const TONE_LABELS = { 1: 'High and level', 2: 'Rising', 3: 'Low / dipping', 4: 'Falling' } as const;
export const toneItem = (id: string) => TONE_ITEMS.find(item => item.id === id);
export const toneAnswer = (item: ToneItem) => item.tones.join('-');
export type ToneSession = {
  id: string; version: string; mode: ToneMode; startedAt: string;
  order: string[]; answers: string[]; retryOf?: string; focus?: Tone[];
};
export const isToneComplete = (session: ToneSession) => session.answers.length === session.order.length;

function shuffle<T>(items: T[], random: () => number) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) { const j = Math.min(i, Math.floor(Math.max(0, random()) * (i + 1))); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}

/** Round-robin across shuffled tone categories, then shuffle the selected set.
 * No fixed answer-position pattern and no duplicate recordings in a session. */
export function createToneSession(mode: ToneMode, size: 10 | 20, options: { random?: () => number; id?: string; now?: string; focus?: Tone[] } = {}): ToneSession {
  const random = options.random ?? Math.random;
  const focus = options.focus?.length === 2 && new Set(options.focus).size === 2 && options.focus.every(t => TONES.includes(t)) ? options.focus : undefined;
  const pool = TONE_ITEMS.filter(item => item.mode === mode && (!focus || item.tones.every(t => focus.includes(t))));
  const groups = new Map<string, ToneItem[]>();
  for (const item of shuffle(pool, random)) { const key = toneAnswer(item); groups.set(key, [...(groups.get(key) ?? []), item]); }
  const buckets = shuffle([...groups.values()], random);
  const chosen: ToneItem[] = [];
  while (chosen.length < size && buckets.some(b => b.length)) for (const bucket of buckets) { if (chosen.length < size && bucket.length) chosen.push(bucket.pop()!); }
  return { id: options.id ?? crypto.randomUUID(), version: TONE_BANK_VERSION, mode, startedAt: options.now ?? new Date().toISOString(), order: shuffle(chosen, random).map(item => item.id), answers: [], ...(focus ? { focus } : {}) };
}

export function answerToneSession(session: ToneSession, itemId: string, answer: string, played: boolean): ToneSession {
  if (!played) throw new Error('Listen to the complete audio before checking an answer.');
  if (isToneComplete(session) || session.order[session.answers.length] !== itemId) throw new Error('This question was already answered or is not current.');
  if (!(session.mode === 'single' ? /^[1-4]$/ : /^[1-4]-[1-4]$/).test(answer)) throw new Error('Choose a tone for each syllable.');
  return { ...session, answers: [...session.answers, answer] };
}

export function retryToneMistakes(session: ToneSession, options: { id?: string; now?: string } = {}): ToneSession | undefined {
  if (!isToneComplete(session)) return undefined;
  const order = session.order.filter((id, i) => toneAnswer(toneItem(id)!) !== session.answers[i]);
  if (!order.length) return undefined;
  return { id: options.id ?? crypto.randomUUID(), version: session.version, mode: session.mode, startedAt: options.now ?? new Date().toISOString(), order, answers: [], retryOf: session.id };
}

export function toneSessionReport(session: ToneSession) {
  const byTone = TONES.map(tone => ({ tone, total: 0, correct: 0 }));
  const positions = [{ total: 0, correct: 0 }, { total: 0, correct: 0 }];
  const confusion = new Map<string, { expected: Tone; heard: Tone; count: number }>();
  let correct = 0;
  session.answers.forEach((answer, index) => {
    const item = toneItem(session.order[index]); if (!item) return;
    if (answer === toneAnswer(item)) correct++;
    item.tones.forEach((expected, position) => {
      const heard = Number(answer.split('-')[position]) as Tone;
      byTone[expected - 1].total++; positions[position].total++;
      if (expected === heard) { byTone[expected - 1].correct++; positions[position].correct++; }
      else { const key = `${expected}-${heard}`; const entry = confusion.get(key) ?? { expected, heard, count: 0 }; entry.count++; confusion.set(key, entry); }
    });
  });
  return { correct, total: session.answers.length, percent: session.answers.length ? Math.round(correct * 100 / session.answers.length) : 0, byTone, positions: positions.slice(0, session.mode === 'single' ? 1 : 2), confusions: [...confusion.values()].sort((a, b) => b.count - a.count) };
}

/** Validate persisted/client data against the current trusted bank; scores are
 * always recomputed. Malformed, stale or oversized data never drives the UI. */
export function parseToneSession(value: unknown): ToneSession | undefined {
  if (!value || typeof value !== 'object') return;
  const s = value as ToneSession;
  if (typeof s.id !== 'string' || !/^[a-zA-Z0-9_-]{8,80}$/.test(s.id) || s.version !== TONE_BANK_VERSION || !['single', 'double'].includes(s.mode)) return;
  if (typeof s.startedAt !== 'string' || !Number.isFinite(Date.parse(s.startedAt)) || Date.parse(s.startedAt) > Date.now() + 86400000) return;
  if (!Array.isArray(s.order) || !s.order.length || s.order.length > 20 || new Set(s.order).size !== s.order.length || s.order.some(id => toneItem(id)?.mode !== s.mode)) return;
  if (!Array.isArray(s.answers) || s.answers.length > s.order.length || s.answers.some(a => typeof a !== 'string' || !(s.mode === 'single' ? /^[1-4]$/ : /^[1-4]-[1-4]$/).test(a))) return;
  if (s.retryOf !== undefined && (typeof s.retryOf !== 'string' || !/^[a-zA-Z0-9_-]{8,80}$/.test(s.retryOf) || s.retryOf === s.id)) return;
  if (s.focus !== undefined && (!Array.isArray(s.focus) || s.focus.length !== 2 || new Set(s.focus).size !== 2 || s.focus.some(t => !TONES.includes(t)) || s.order.some(id => toneItem(id)!.tones.some(t => !s.focus!.includes(t))))) return;
  return { id: s.id, version: s.version, mode: s.mode, startedAt: new Date(s.startedAt).toISOString(), order: [...s.order], answers: [...s.answers], ...(s.retryOf ? { retryOf: s.retryOf } : {}), ...(s.focus ? { focus: [...s.focus] } : {}) };
}

export function parseToneHistory(value: unknown): ToneSession[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 20).map(parseToneSession).filter((s): s is ToneSession => Boolean(s));
}

/** Append-only merge: older tabs cannot replace a longer saved attempt or change
 * an already checked answer. Newer valid progress on the same branch can extend it. */
export function mergeToneHistory(existing: ToneSession[], incoming: ToneSession[]): ToneSession[] {
  const merged = new Map(parseToneHistory(existing).map(s => [s.id, s]));
  for (const session of parseToneHistory(incoming)) {
    const current = merged.get(session.id);
    if (!current) { merged.set(session.id, session); continue; }
    if (current.mode !== session.mode || current.startedAt !== session.startedAt || current.retryOf !== session.retryOf || JSON.stringify(current.focus) !== JSON.stringify(session.focus) || current.order.join('|') !== session.order.join('|')) continue;
    if (session.answers.length > current.answers.length && current.answers.every((a, i) => session.answers[i] === a)) merged.set(session.id, session);
  }
  return [...merged.values()].sort((a, b) => b.startedAt.localeCompare(a.startedAt) || a.id.localeCompare(b.id)).slice(0, 20);
}
