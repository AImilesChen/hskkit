import type { Metadata } from "next";
import Link from "next/link";
import PlannerClient from "./planner-client";
import SiteFooter from "../site-footer";
import SiteHeader from "../site-header";

export const metadata: Metadata = { title: "Study Planner | HSKKit", description: "Build a feasible Chinese study plan from your goal, available time, weak points and real SRS load.", robots: { index: false, follow: false } };
export default function PlannerPage() {
  return <><SiteHeader/><main className="learn planner-page"><header><span className="eyebrow">Deterministic plan · Optional AI support</span><h1>Your study planner</h1><p>Generate and version a plan from your real target, schedule, unresolved weak points and due SRS workload. Impossible targets are rejected instead of creating work you cannot finish.</p><nav aria-label="Learning navigation"><Link href="/today">Today</Link><Link href="/grammar/ba-sentence-basics">Grammar</Link><Link href="/reading/morning-study-routine">Reading</Link><Link href="/listen">Listening</Link></nav></header><PlannerClient/></main><SiteFooter/></>;
}
