import type { Tone } from '@/lib/tones/domain';

const paths: Record<Tone, string> = {
  1: 'M24 20 L216 20',
  2: 'M24 65 Q116 56 216 18',
  3: 'M24 44 Q80 82 146 68',
  4: 'M24 18 L216 72',
};
const labels: Record<Tone, string> = {
  1: 'Tone 1: a steady high pitch',
  2: 'Tone 2: rising pitch',
  3: 'Tone 3: low or dipping pitch; the dashed final rise depends on context',
  4: 'Tone 4: falling pitch',
};

/** An educational schematic, not a pitch trace measured from the recording. */
export default function ToneContour({ tone }: { tone: Tone }) {
  return <svg className="tone-contour" viewBox="0 0 240 90" role="img" aria-label={labels[tone]}>
    <path className="tone-contour-grid" d="M18 20H224 M18 48H224 M18 76H224" />
    <path className="tone-contour-line" d={paths[tone]} />
    {tone === 3 && <path className="tone-contour-optional" d="M146 68 Q186 56 216 30" />}
  </svg>;
}
