import type { Metadata } from "next";
import Link from "next/link";
import { StudyPage } from "@/app/components/study-shell";
import { FormalHistory } from "./formal-history";
import "../../test-pages.css";
import "./formal-exam.css";

export const metadata: Metadata = {
  title: "HSK 5 Full-length Mock Exams: Free Paper & Pro Papers | HSKKit",
  description: "Practise HSK 5 with 72 questions, single-reading Mandarin listening, reading passages, paragraph ordering, a four-picture story and a topic essay. Take free Paper A or unlock Papers B and C with Pro. Review your answers after submission.",
  alternates: { canonical: "/hsk-test-prep/hsk-5/mock" },
};
export default function FormalExamLanding() {
  return <StudyPage><main className="test-public-page formal-page">
    <nav className="test-breadcrumb" aria-label="Breadcrumb"><Link href="/hsk-test-prep">Practice tests</Link><span>/</span><span>HSK 5 mock exams</span></nav>
    <header className="test-public-hero"><p className="test-eyebrow">Listen. Read. Put it together.</p><h1>HSK 5 <span className="test-title-accent">mock exams</span></h1><p>Three complete papers to practise the current HSK 5 format. Start with Paper A, then use two different Pro papers to practise again.</p></header>
    <div className="formal-facts"><span><strong>72</strong> questions</span><span><strong>35</strong> listening · <strong>35</strong> reading · <strong>2</strong> writing</span><span>Listening read once</span><span>Four-picture story &amp; topic essay</span></div>
    <section className="formal-paper-grid" aria-label="Choose your paper">{(["a", "b", "c"] as const).map((form, i) => <article className={`formal-paper-card formal-card-${form}`} key={form}>
      <div className="formal-card-top"><span className="formal-paper-letter" aria-hidden="true">{form.toUpperCase()}</span><span className="formal-badge">{i === 0 ? "FREE" : "PRO"}</span></div>
      <h2>Paper {form.toUpperCase()}</h2><p>{["Your first complete practice run.", "A fresh set for your next attempt.", "Build confidence with a third paper."][i]}</p>
      <ul><li>72 original questions</li><li>25-minute Mandarin listening track</li><li>Objective scores, writing self-review &amp; explanations</li></ul>
      <Link className={i === 0 ? "test-primary-link" : "test-secondary-link"} prefetch={false} href={`/hsk-test-prep/hsk-5/mock/${form}`}>{i === 0 ? "Open free Paper A" : `Open Pro Paper ${form.toUpperCase()}`} →</Link>
    </article>)}</section>
    <section className="formal-how"><div><p className="test-eyebrow">Know the rhythm</p><h2>Get ready, then begin.</h2><p>Allow about 110 minutes including up to 5 minutes to get ready. The 105-minute timer starts when you begin.</p></div><ol><li><strong>25 min · Listening</strong><span>Each dialogue or passage is read once. Complete 35 questions in two parts.</span></li><li><strong>5 min · Check listening answers</strong><span>Review your listening choices before the reading section opens.</span></li><li><strong>35 min · Reading</strong><span>Complete 35 questions: cloze passages, paragraph ordering and reading comprehension.</span></li><li><strong>40 min · Writing</strong><span>Write a four-picture story of at least 100 Chinese characters and a topic essay of at least 200 Chinese characters. Your attempt submits when the timer ends.</span></li></ol></section>
    <FormalHistory />
    <section className="test-public-section test-faq"><h2>Before you begin</h2><details><summary>What do Free and Pro include?</summary><p>Paper A is free and works without an account. An active Pro subscription, Pro trial or Pro pass unlocks Papers B and C. Your existing free skills checks remain available.</p></details><details><summary>Can I leave and return?</summary><p>Your saved answers and original deadline stay with the attempt. Return in the same browser as a guest, or the same account when signed in. Leaving does not pause the timer.</p></details><details><summary>How is my result scored?</summary><p>Each correct objective answer earns one raw mark, up to 70, with listening and reading marks out of 35 each. Both writing tasks need self-review. The story has a separate 10-point editorial rubric and the topic essay a separate 20-point rubric; writing is not automatically graded or combined with objective marks. Review every answer. These independent HSKKit papers are not official exams, scaled scores or pass predictions.</p></details><details><summary>Can I review the recording and script?</summary><p>Yes. Listening transcripts, question recordings and explanations are available after you submit. The listening voice is synthesized Mandarin.</p></details></section>
    <p className="test-boundary-note">Want a shorter check? <Link href="/hsk-test-prep/hsk-5">Take the free 15-question HSK 5 skills check →</Link></p>

  </main></StudyPage>;
}
