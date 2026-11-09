import Link from "next/link";
import { FREE_MOCK_COUNT, TOTAL_MOCK_COUNT, EXTRA_MOCK_COUNT, MOCK_LEVEL_RANGE } from "@/lib/formal-exams/offer";
import { MockPaperLinks } from "../components/mock-paper-links";

export function MockExamShowcase() {
  return <section id="mock-papers" className="pricing-section pricing-mock-showcase" aria-labelledby="mock-showcase-title">
    <div className="pricing-section-heading"><p className="pricing-eyebrow">Complete practice · {MOCK_LEVEL_RANGE}</p><h2 id="mock-showcase-title">One level. Three complete papers.</h2><p>Start with {FREE_MOCK_COUNT} free A papers. Pro includes all {TOTAL_MOCK_COUNT} — {EXTRA_MOCK_COUNT} additional B/C papers for fresh practice at the same level.</p></div>
    <div className="pricing-mock-experience"><div className="pricing-mock-screens"><p className="pricing-screen-caption">Sample screens · HSK 6 Paper A</p><figure><img src="/pricing/mock-exam-question.jpg" alt="HSK 6 listening question with a saved answer choice" width="839" height="527" loading="lazy"/><figcaption>During your paper · answer and save your choice</figcaption></figure><figure><img src="/pricing/mock-exam-review.jpg" alt="Submitted HSK 6 sample with the correct answer, explanation and listening transcript" width="789" height="505" loading="lazy"/><figcaption>After submission · explanations and listening scripts</figcaption></figure></div>
    <ol className="pricing-mock-steps"><li><span>01</span><div><h3>Practise with a timer.</h3><p>Follow the timed sections for your chosen level. Each level has its own question count and duration.</p></div></li><li><span>02</span><div><h3>Review your answers.</h3><p>Check explanations and revisit listening recordings and scripts after you submit.</p></div></li><li><span>03</span><div><h3>Try a different paper.</h3><p>Use Papers B and C for two fresh question sets at the same level through Pro.</p></div></li><li className="pricing-mock-note"><p>Writing tasks, where included, provide reference responses and self-review. These independent papers do not provide official scores or automatic writing assessment.</p></li></ol></div>
    <div className="pricing-section-heading"><h3>Choose your level. Try Paper A free.</h3><p>No account needed for Paper A. Existing Pro access, eligible trials and Pro passes unlock B/C.</p></div><MockPaperLinks/>
    <div className="pricing-mock-footer"><Link className="pricing-button pricing-button-primary" href="#plans">Compare Free and Pro ↑</Link><p>Retakes use the same paper. Choose B or C for a different set of questions.</p></div>
  </section>;
}
