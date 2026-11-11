import "./today-workbench.css";
import type { Metadata } from "next";
import SiteHeader from "../site-header";
import SiteFooter from "../site-footer";
import LearningDashboard from "../components/learning-dashboard";
import { practiceQuestionSet, PRACTICE_SESSION_SIZE } from "@/lib/practice/questions";

export const metadata: Metadata = { title: "Today | HSKKit", robots: { index: false, follow: false } };
// Build-time summaries only: no prompts, answers or question-bank data enter the client bundle.
const practiceInfo = Array.from({ length: 7 }, (_, index) => {
  const level = index + 1, questions = practiceQuestionSet(level, "vocabulary");
  return { contentId: `practice:${level}:vocabulary`, version: questions[0]?.setVersion ?? "", count: Math.min(PRACTICE_SESSION_SIZE, questions.length) };
}).filter(info => info.count > 0 && info.version);

export default function Page() {
  return <><SiteHeader/><LearningDashboard mode="today" practiceInfo={practiceInfo}/><SiteFooter/></>;
}
