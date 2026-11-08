import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StudyPage } from "@/app/components/study-shell";
import { isForm } from "@/lib/formal-exams/hsk5/domain";
import { FormalRunner } from "../formal-runner";
import "../../../test-pages.css";
import "../formal-exam.css";
export const metadata: Metadata = { title: "HSK 5 Mock Exam | HSKKit", robots: { index: false, follow: true } };
export default async function FormalPaperPage({ params }: { params: Promise<{ form: string }> }) {
  const { form } = await params;
  if (!isForm(form)) notFound();
  return <StudyPage><main className="test-public-page formal-page"><FormalRunner form={form} /></main></StudyPage>;
}
