import { TONE_ITEMS, type Tone, type ToneItem } from './domain.ts';

function example(hanzi: string, tone: Tone): ToneItem {
  const item = TONE_ITEMS.find(i => i.mode === 'single' && i.hanzi === hanzi && i.tones[0] === tone);
  if (!item) throw new Error(`Missing published tone example: ${hanzi}`);
  return item;
}

export const TONE_GUIDES = [
  { tone: 1 as Tone, mark: 'ā', name: 'High and level', hint: 'Listen for a steady high pitch, without a rise or fall.', item: example('八', 1) },
  { tone: 2 as Tone, mark: 'á', name: 'Rising', hint: 'Listen for the pitch moving up towards the end.', item: example('茶', 2) },
  { tone: 3 as Tone, mark: 'ǎ', name: 'Low / dipping', hint: 'Listen for the low part. A clear final rise is not always present.', item: example('买', 3) },
  { tone: 4 as Tone, mark: 'à', name: 'Falling', hint: 'Listen for a clear movement from high to low.', item: example('爱', 4) },
];

export const TONE_CONTRASTS = [
  { id: 'ci-2-4', name: 'Rising or falling?', tones: [2, 4] as const, items: [example('词', 2), example('次', 4)], hint: 'Compare the direction: cí rises, while cì falls.' },
  { id: 'da-3-4', name: 'Low or falling?', tones: [3, 4] as const, items: [example('打', 3), example('大', 4)], hint: 'Listen for the low part in dǎ and the high-to-low movement in dà.' },
  { id: 'dian-3-4', name: 'Try the same contrast again.', tones: [3, 4] as const, items: [example('点', 3), example('电', 4)], hint: 'Compare diǎn with diàn. Follow the pitch, not how loud the recording sounds.' },
];
