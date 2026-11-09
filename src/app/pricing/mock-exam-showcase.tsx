import Link from "next/link";
import freePaper from "@/lib/formal-exams/data/a.json";
import type { ExamPaper } from "@/lib/formal-exams/types";
import { FREE_MOCK_COUNT, TOTAL_MOCK_COUNT, EXTRA_MOCK_COUNT, MOCK_LEVEL_RANGE } from "@/lib/formal-exams/offer";
import { MockPaperLinks } from "../components/mock-paper-links";
import { MockExamDemo } from "./mock-exam-demo";
import "./mock-exam-showcase.css";

export function MockExamShowcase() {
  // Project one public Paper A question on the server. Never pass a full bank to the demo.
  const paper = freePaper as unknown as ExamPaper;
  const question = paper.parts.flatMap(part => part.questions).find(item => item.number === 38);
  if (!question?.options) throw new Error("PRICING_SAMPLE_UNAVAILABLE");
  const sample = {
    questionNumber: question.number!,
    context: question.stem.split("\n")[0],
    prompt: question.stem.split("\n").slice(1).join("\n"),
    options: Object.entries(question.options).map(([key, value]) => ({ key, text: value.text ?? "" })),
    correctAnswer: question.answer,
    explanation: question.explanationEn,
    readingMinutes: freePaper.timing.readingSeconds / 60,
  };
  return <section id="mock-papers" className="pricing-section pricing-mock-showcase" aria-labelledby="mock-showcase-title">
    <div className="pricing-section-heading"><p className="pricing-eyebrow">Complete practice · {MOCK_LEVEL_RANGE}</p><h2 id="mock-showcase-title">One level. Three complete papers.</h2><p>Start with {FREE_MOCK_COUNT} free A papers. Pro includes all {TOTAL_MOCK_COUNT} — {EXTRA_MOCK_COUNT} additional B/C papers for fresh practice at the same level.</p></div>
    <MockExamDemo sample={sample}/>
    <p className="mock-demo-boundary">Writing tasks include reference responses and self-review. These independent practice papers do not provide official scores or automatic writing assessment.</p>
    <div className="pricing-section-heading"><h3>Choose your level. Try Paper A free.</h3><p>No account needed for Paper A. Existing Pro access, eligible trials and Pro passes unlock B/C.</p></div><MockPaperLinks/>
    <div className="pricing-mock-footer"><Link className="pricing-button pricing-button-primary" href="#plans">Compare Free and Pro ↑</Link><p>Retakes use the same paper. Choose B or C for a different set of questions.</p></div>
  </section>;
}
