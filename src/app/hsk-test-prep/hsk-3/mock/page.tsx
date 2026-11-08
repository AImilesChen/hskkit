import type { Metadata } from "next";
import Link from "next/link";
import { StudyPage } from "@/app/components/study-shell";
import { FormalHistory } from "./formal-history";
import "../../test-pages.css";
import "./formal-exam.css";

export const metadata: Metadata = {
  title: "HSK 3 Full-length Mock Exams: Free Paper & Pro Papers | HSKKit",
  description: "Practise HSK 3 with 70 questions, Mandarin listening, picture tasks, character writing and sentence prompts. Take free Paper A or unlock Papers B and C with Pro. Review your answers after submission.",
  alternates: { canonical: "/hsk-test-prep/hsk-3/mock" },
};
export default function FormalExamLanding() {
  return <StudyPage><main className="test-public-page formal-page">
    <nav className="test-breadcrumb" aria-label="Breadcrumb"><Link href="/hsk-test-prep">Practice tests</Link><span>/</span><span>HSK 3 mock exams</span></nav>
    <header className="test-public-hero"><p className="test-eyebrow">Listen. Read. Put it together.</p><h1>HSK 3 <span className="test-title-accent">mock exams</span></h1><p>Three complete papers to practise the current HSK 3 format. Start with Paper A, then use two different Pro papers to practise again.</p></header>
    <div className="formal-facts"><span><strong>70</strong> questions</span><span><strong>30</strong> listening · <strong>30</strong> reading · <strong>10</strong> writing</span><span><strong>8</strong> parts</span><span>Character blanks &amp; picture sentences</span></div>
    <section className="formal-paper-grid" aria-label="Choose your paper">{(["a", "b", "c"] as const).map((form, i) => <article className={`formal-paper-card formal-card-${form}`} key={form}>
      <div className="formal-card-top"><span className="formal-paper-letter" aria-hidden="true">{form.toUpperCase()}</span><span className="formal-badge">{i === 0 ? "FREE" : "PRO"}</span></div>
      <h2>Paper {form.toUpperCase()}</h2><p>{["Your first complete practice run.", "A fresh set for your next attempt.", "Build confidence with a third paper."][i]}</p>
      <ul><li>70 original questions</li><li>23-minute Mandarin listening track</li><li>Objective scores, sentence self-review &amp; explanations</li></ul>
      <Link className={i === 0 ? "test-primary-link" : "test-secondary-link"} prefetch={false} href={`/hsk-test-prep/hsk-3/mock/${form}`}>{i === 0 ? "Open free Paper A" : `Open Pro Paper ${form.toUpperCase()}`} →</Link>
    </article>)}</section>
    <section className="formal-how"><div><p className="test-eyebrow">Know the rhythm</p><h2>Get ready, then begin.</h2><p>Allow about 83 minutes including up to 5 minutes to get ready. The 78-minute timer starts when you begin.</p></div><ol><li><strong>23 min · Listening</strong><span>Each question is read twice. Work through three parts with the full recording.</span></li><li><strong>5 min · Check listening answers</strong><span>Review your listening choices before the reading section opens.</span></li><li><strong>30 min · Reading</strong><span>Complete three reading parts.</span></li><li><strong>20 min · Writing</strong><span>Complete five single-character blanks and five picture sentences. Your attempt submits when the timer ends.</span></li></ol></section>
    <FormalHistory />
    <section className="test-public-section test-faq"><h2>Before you begin</h2><details><summary>What do Free and Pro include?</summary><p>Paper A is free and works without an account. An active Pro subscription, Pro trial or Pro pass unlocks Papers B and C. Your existing free skills checks remain available.</p></details><details><summary>Can I leave and return?</summary><p>Your saved answers and original deadline stay with the attempt. Return in the same browser as a guest, or the same account when signed in. Leaving does not pause the timer.</p></details><details><summary>How is my result scored?</summary><p>Each correct answer earns one raw mark, up to 65 objective marks, with five sentences for self-review. See listening and reading marks out of 30 each, plus character writing out of 5. The five sentence tasks are not automatically graded. Review every answer. These independent HSKKit papers are not official exams, scaled scores or pass predictions.</p></details><details><summary>Can I review the recording and script?</summary><p>Yes. Listening transcripts, question recordings and explanations are available after you submit. The listening voice is synthesized Mandarin.</p></details></section>
    <p className="test-boundary-note">Want a shorter check? <Link href="/hsk-test-prep/hsk-3">Take the free 15-question HSK 3 skills check →</Link></p>

  </main></StudyPage>;
}
