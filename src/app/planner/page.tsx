import type { Metadata } from "next";
import PlannerClient from "./planner-client";
import SiteFooter from "../site-footer";
import SiteHeader from "../site-header";

export const metadata: Metadata = {
  title: "Study Planner | HSKKit",
  description: "Build a realistic HSK study plan from your goal, available time, weak points and due reviews.",
  alternates: { canonical: "/planner" },
  robots: { index: false, follow: false },
};

export default function PlannerPage() {
  return <>
    <SiteHeader/>
    <main className="learn planner-page">
      <header className="planner-hero">
        <span className="eyebrow">Study plan</span>
        <h1>Build your HSK study plan</h1>
        <p>Set your target, available time and study days. We’ll create a realistic weekly plan using your progress, weak areas and due reviews.</p>
      </header>
      <PlannerClient/>
    </main>
    <SiteFooter/>
  </>;
}
