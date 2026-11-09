import Link from "next/link";
import { MOCK_LEVELS, mockPaperHref } from "@/lib/formal-exams/offer";

export function MockPaperLinks() {
  return <div className="mock-level-links">{MOCK_LEVELS.map(row => <article className="mock-level-link" key={row.level}>
    <div><h3>HSK {row.level}</h3><span>3 papers · <b>A free</b> · B/C with Pro</span></div>
    <p>{row.questions} questions · {row.timedMinutes} timed minutes</p>
    <Link href={mockPaperHref(row.level, "a")} prefetch={false}>Try free Paper A <span aria-hidden="true">→</span></Link>
    <Link href={mockPaperHref(row.level)} prefetch={false} className="mock-all-papers">View all papers</Link>
  </article>)}</div>;
}
