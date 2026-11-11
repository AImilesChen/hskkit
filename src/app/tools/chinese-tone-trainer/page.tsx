import type { Metadata } from 'next';
import Link from 'next/link';
import { StudyPage } from '@/app/components/study-shell';
import ToneTrainer from './tone-trainer';
import ToneLearning from './tone-learning';
import './tone-trainer.css';
import './tone-workbench.css';

export const metadata: Metadata = {
  title: 'Chinese Tone Trainer — Free Mandarin Listening Practice | HSKKit',
  description: 'Practise Mandarin tones with visual guides, side-by-side audio comparisons and free single- or two-syllable listening rounds. Check answers and revisit mistakes.',
  alternates: { canonical: '/tools/chinese-tone-trainer' }, robots: { index: true, follow: true },
  openGraph: { title: 'Chinese Tone Trainer | HSKKit', description: 'Hear the difference. Build your confidence. Free Mandarin tone listening practice.', url: '/tools/chinese-tone-trainer', type: 'website' },
};
export default function ChineseToneTrainerPage() {
  const schema = { '@context': 'https://schema.org', '@type': 'WebApplication', name: 'HSKKit Chinese Tone Trainer', url: 'https://hskkit.com/tools/chinese-tone-trainer', applicationCategory: 'EducationalApplication', operatingSystem: 'Web browser', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } };
  return <StudyPage><main className="tone-page"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} /><nav className="tone-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/listen">Listening</Link><span>/</span><span aria-current="page">Tone trainer</span></nav><header className="tone-hero"><p className="tone-eyebrow">A free tool for a stronger foundation</p><h1>Chinese <span>tone trainer.</span></h1><p>Hear the difference. Build your confidence.</p><p className="tone-hero-note">Practise single sounds and real two-syllable words, then give the tricky ones another listen.</p></header><ToneTrainer />
    <ToneLearning />
    <section className="tone-faq" aria-labelledby="tone-faq-title"><h2 id="tone-faq-title">Questions about practising Chinese tones</h2><div className="tone-faq-grid">
      <details><summary>Can I practise without an account?</summary><p>Yes. The tool is free. Recent rounds stay in this browser when storage is available. Signed-in users can sync rounds to their account; guest rounds are imported only when you choose to bring them in.</p></details>
      <details><summary>What do my results mean?</summary><p>They describe your checked answers in a short listening round. Word scores and syllable breakdowns are separate. A retry has its own result and never replaces the first pass. Small counts are a reason to collect more practice, not proof of mastery or a lasting weakness.</p></details>
      <details><summary>What is the difference between comparisons and two-syllable words?</summary><p>The A/B comparison cards keep one syllable the same and contrast its tones, such as cí and cì. A two-syllable round asks for both tones in one word. Comparisons are unscored; a word counts as correct only when both answers are right.</p></details>
      <details><summary>Why do I need to listen before answering?</summary><p>A completed playback unlocks the choices so you answer by listening. Replay as often as you need. Failed audio is never counted as a wrong answer; use Retry on the player if a recording cannot load.</p></details>
      <details><summary>Why does the third tone sometimes sound low?</summary><p>A full dip and rise is not present in every context. Focus on the low part instead of waiting for a large final rise. The dashed part of the third-tone diagram represents a possible ending, not a measurement of the example recording.</p></details>
      <details><summary>Does this tool include every tone combination?</summary><p>No. This foundation set has 48 single-syllable and 48 two-syllable examples. Neutral tones, 一 / 不 and two consecutive third tones are excluded. Use the linked guides to continue learning about tone changes in connected speech.</p></details>
      <details><summary>Will the tool check my spoken pronunciation?</summary><p>No. It checks listening choices and does not request microphone access. For feedback on your own pronunciation, work with a teacher or another suitable pronunciation-feedback tool.</p></details>
      <details><summary>Are these human voice recordings?</summary><p>The examples use synthesized Mandarin pronunciation. Listen to the same example again whenever you need a closer comparison.</p></details>
    </div></section>
  </main></StudyPage>;
}
