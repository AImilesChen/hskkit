import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StudyPage } from "../../components/study-shell";
import { TEST_LEVELS, findTestLevel, testLevelHref, testRunnerHref } from "@/lib/tests/test-levels";
import { testLevelContent } from "@/lib/tests/test-level-content";
import { TestLandingEvents } from "../test-landing-events";
import "../test-pages.css";

type Props = { params: Promise<{ level: string }> };
export function generateStaticParams() { return TEST_LEVELS.map(level => ({ level: level.slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const level = findTestLevel((await params).level);
  if (!level) return { title: "Test unavailable | HSKKit", robots: { index: false, follow: false } };
  const title = `Free HSK ${level.level === 7 ? "7–9" : level.level} Practice Test | HSKKit`;
  const description = `${level.lead} Preview real sample questions, then take a free 15-question grammar, reading and listening check with a ${level.minutes}-minute limit.`;
  return { title, description, alternates: { canonical: testLevelHref(level) }, robots: { index: true, follow: true }, openGraph: { title, description, url: testLevelHref(level), type: "website" } };
}

export default async function LevelTestPage({ params }: Props) {
  const level = findTestLevel((await params).level);
  if (!level) notFound();
  const { samples, resources } = testLevelContent(level);
  const runner = testRunnerHref(level);
  const title = level.level === 7 ? "HSK 7–9" : level.label;
  const schema = { "@context": "https://schema.org", "@graph": [
    { "@type": "WebPage", name: `${title} practice test`, url: `https://hskkit.com${testLevelHref(level)}`, description: level.lead },
    { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "HSK practice tests", item: "https://hskkit.com/hsk-test-prep" }, { "@type": "ListItem", position: 2, name: title, item: `https://hskkit.com${testLevelHref(level)}` }] },
  ] };
  const eventLevel = level.level === 7 ? "7-9" : String(level.level);
  return <StudyPage><div className="test-page-surface"><main className="test-public-page test-level-page">
    <TestLandingEvents page="level_landing" level={eventLevel} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    <nav className="test-breadcrumb" aria-label="Breadcrumb"><Link href="/hsk-test-prep">Practice tests</Link><span aria-hidden="true">/</span><span aria-current="page">{title}</span></nav>
    <header className="test-public-hero"><p className="test-eyebrow">{level.level === 7 ? "One unified advanced band" : "Level-specific skills check"}</p><h1>{title} <span className="test-title-accent">practice test</span></h1><p>{level.lead}</p>
      <ul className="test-hero-facts"><li><strong>15</strong> questions</li><li><strong>{level.minutes}</strong> minutes</li><li>Grammar · Reading · Listening</li></ul>
      <div className="test-hero-actions"><Link href={runner} prefetch={false} className="test-primary-link" data-test-entry="skills-runner" data-test-level={eventLevel}>Open {title} test →</Link><a href="#sample-questions" className="test-text-link">Try the sample questions</a></div><p className="test-free-note">Free to take · No account needed · Timer starts when you begin the test</p>
    </header>
    {level.level === 1 && <section className="test-placement-invitation"><div><p className="test-eyebrow">Ready for a complete paper?</p><h2>Try the HSK 1 mock exams.</h2><p>40 questions · 20 listening and 20 reading · Free Paper A, plus Pro Papers B and C.</p></div><Link href="/hsk-test-prep/hsk-1/mock" className="test-primary-link">Explore complete papers →</Link></section>}
    {level.level === 2 && <section className="test-placement-invitation"><div><p className="test-eyebrow">Ready for a complete paper?</p><h2>Try the HSK 2 mock exams.</h2><p>60 questions · Listening 25, reading 25, writing 10 · Free Paper A, plus Pro Papers B and C.</p></div><Link href="/hsk-test-prep/hsk-2/mock" className="test-primary-link">Explore complete papers →</Link></section>}
    <nav className="test-level-nav" aria-label="Practice test levels">{TEST_LEVELS.map(item => <Link key={item.slug} href={testLevelHref(item)} aria-current={item.slug === level.slug ? "page" : undefined}>{item.label}</Link>)}</nav>

    <section className="test-public-section" aria-labelledby="level-skills-title"><div className="test-section-intro"><p className="test-eyebrow">What you’ll practise</p><h2 id="level-skills-title">Three skills. Five tasks each.</h2></div><div className="test-three-column test-skill-columns">
      <article><span className="test-small-label">01 / Grammar</span><h3>Choose the expression</h3><p>{level.grammar}</p></article>
      <article><span className="test-small-label">02 / Reading</span><h3>Read for meaning</h3><p>{level.reading}</p></article>
      <article><span className="test-small-label">03 / Listening</span><h3>Follow the recording</h3><p>{level.listening}</p></article>
    </div></section>

    <section className="test-public-section" id="sample-questions" aria-labelledby="sample-title"><div className="test-section-heading"><div><p className="test-eyebrow">A little practice first</p><h2 id="sample-title">Try two {title} sample questions.</h2><p>Published HSKKit lesson tasks. Samples don’t start a timed test or save a score.</p></div></div>
      <div className="test-sample-grid">{samples.map(sample => <article className="test-sample" key={sample.exercise.id}>
        <p className="test-card-kicker">{sample.skill} sample</p><h3 lang={/[\u3400-\u9fff]/.test(sample.exercise.prompt) ? "zh-Hans" : "en"}>{sample.exercise.prompt}</h3>
        {sample.context && <p className="test-sample-context" lang="zh-Hans">{sample.context}</p>}
        <ol className="test-sample-options">{Object.entries(sample.exercise.options ?? {}).map(([key, value]) => <li key={key}><span className="test-option-key">{key}</span><span lang={/[\u3400-\u9fff]/.test(value) ? "zh-Hans" : "en"}>{value}</span></li>)}</ol>
        <details className="test-sample-answer"><summary>Show answer &amp; explanation</summary><div><p><strong>Answer {sample.exercise.correctAnswer}:</strong> <span lang={/[\u3400-\u9fff]/.test(sample.exercise.options?.[sample.exercise.correctAnswer] ?? "") ? "zh-Hans" : "en"}>{sample.exercise.options?.[sample.exercise.correctAnswer]}</span></p><p>{sample.exercise.explanation}</p></div></details>
      </article>)}</div>
    </section>

    <section className="test-public-section test-result-explainer" aria-labelledby="level-results-title"><div><p className="test-eyebrow">After your check</p><h2 id="level-results-title">See what to work on next.</h2><p>Use the result to guide your next practice session.</p></div><ul><li><strong>A score for this question set</strong><span>See correct, incorrect and unanswered tasks.</span></li><li><strong>A breakdown by skill</strong><span>Compare grammar, reading and listening performance.</span></li><li><strong>Answers and focused practice</strong><span>Review explanations and open practice for the skill that needs attention.</span></li></ul></section>
    <p className="test-boundary-note">This is an independent HSKKit skills check, not an official HSK score or full-length mock exam. Speaking, writing and translation are not assessed.</p>

    <section className="test-public-section" aria-labelledby="level-prepare-title"><div className="test-section-intro"><p className="test-eyebrow">Build confidence before you begin</p><h2 id="level-prepare-title">Study at {title}.</h2></div><div className="test-resource-grid">{resources.map(resource => <Link key={resource.href} href={resource.href} data-test-entry="learning-resource" data-test-level={eventLevel}><strong>{resource.title}<span aria-hidden="true"> ↗</span></strong><span>{resource.description}</span></Link>)}</div></section>

    <section className="test-public-section test-faq" aria-labelledby="level-faq-title"><div className="test-section-intro"><h2 id="level-faq-title">About this {title} test</h2></div>
      <details><summary>What’s included?</summary><p>Fifteen tasks: five grammar, five reading and five listening questions. The time limit is {level.minutes} minutes. {level.level === 7 ? "Advanced 7–9 is one unified band, with source material from all three advanced levels." : `This check draws from the HSKKit practice pool for HSK ${level.level}.`}</p></details>
      <details><summary>When does the timer start?</summary><p>Opening this introduction does not create an attempt. The timer starts only when you click Start on the test preparation screen.</p></details>
      <details><summary>Can I continue an unfinished test?</summary><p>Yes. Return in the same browser to restore your saved attempt at this level. The timer continues from the original deadline; leaving does not pause it. Other levels’ saved attempts remain separate.</p></details>
      <details><summary>Will this tell me which level to study?</summary><p>This check gives feedback at a level you choose. If you need a suggested starting level, take the <Link href="/hsk-placement-test">adaptive HSK placement test</Link>.</p></details>
    </section>
    <section className="test-bottom-cta"><div><h2>Ready to check your {title} skills?</h2><p>15 questions · {level.minutes} minutes · Free to take</p></div><Link href={runner} prefetch={false} className="test-primary-link" data-test-entry="skills-runner" data-test-level={eventLevel}>Open {title} test →</Link></section>
  </main></div></StudyPage>;
}
