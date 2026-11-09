import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StudyPage } from "../../components/study-shell";
import { AP_FORMS, AP_HREF, apPaperHref, isApForm } from "@/lib/ap-exams/catalog";
import { ApPaperAccess } from "../paper-access";
import "../ap-exams.css";
export function generateStaticParams() { return AP_FORMS.map(form => ({ form })); }
export async function generateMetadata({ params }: { params: Promise<{ form: string }> }): Promise<Metadata> {
  const { form } = await params;
  if (!isApForm(form)) return { title: "Paper not found" };
  return { title: `AP Chinese 2027 · Paper ${form.toUpperCase()} | HSKKit`, alternates: { canonical: apPaperHref(form) }, robots: { index: false, follow: true } };
}
export default async function ApPaperPage({ params }: { params: Promise<{ form: string }> }) {
  const { form } = await params;
  if (!isApForm(form)) notFound();
  return <StudyPage><main className="ap-page ap-paper-intro"><nav className="ap-breadcrumb" aria-label="Breadcrumb"><Link href={AP_HREF}>AP Chinese practice</Link><span>/</span><span aria-current="page">Paper {form.toUpperCase()}</span></nav><header className="ap-hero"><p className="ap-eyebrow">AP Chinese 2027 · {form === "a" ? "Free complete paper" : "Included with Pro"}</p><h1>Paper {form.toUpperCase()}.<br/><span>A complete practice run.</span></h1><p className="ap-lead">25 listening questions, 30 reading questions and four free-response tasks. Choose guided practice or open a section when you are ready.</p></header><section className="ap-start-panel" aria-label="Open this paper"><ApPaperAccess form={form}/><p className="ap-subtle">Opening the workspace does not start a clock. Prepare your speaking research first.</p></section><div className="ap-info-grid"><section><h2>Have these ready.</h2><ul><li>Headphones and a quiet place</li><li>Your source-based music research notes</li><li>A Chinese input method for writing</li><li>A microphone, or a separately recorded audio file</li></ul></section><section><h2>Your work stays here.</h2><p>AP answers and recordings are stored in this browser, separately from synced HSK history. Export your written responses and download your audio to keep a copy.</p><p>Speaking and writing need manual review. Objective results are raw accuracy, not an AP 1–5 prediction.</p></section></div><div className="ap-notice"><h2>Original music-research practice</h2><p>The official 2027 annual project packet is scheduled for January 2027. This paper uses an independent music scenario and sources to support your own research.</p></div><Link href={AP_HREF}>← Compare all three papers</Link></main></StudyPage>;
}
