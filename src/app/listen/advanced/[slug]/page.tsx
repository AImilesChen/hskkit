import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Step7ExerciseClient from "@/app/components/step7-exercise";
import SiteFooter from "@/app/site-footer";
import SiteHeader from "@/app/site-header";
import { ADVANCED_LISTENING_LESSONS, advancedListeningBySlug } from "@/lib/learning/step7-content";

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return ADVANCED_LISTENING_LESSONS.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lesson = advancedListeningBySlug((await params).slug);
  return lesson ? { title: `${lesson.title} | HSKKit Listening`, robots: { index: false, follow: false } } : { title: "Listening unavailable | HSKKit" };
}
export default async function AdvancedListeningPage({ params }: Props) {
  const lesson = advancedListeningBySlug((await params).slug);
  if (!lesson) notFound();
  const index = ADVANCED_LISTENING_LESSONS.findIndex((item) => item.slug === lesson.slug);
  const next = ADVANCED_LISTENING_LESSONS[index + 1];
  return <><SiteHeader/><main className="learn step7-page"><header><span className="eyebrow">Advanced listening · HSK {lesson.level}</span><h1>{lesson.title}</h1><p>{lesson.guidance}</p><nav aria-label="Learning navigation"><Link href="/listen">All listening</Link><Link href="/review">Review</Link><Link href="/mistakes">Mistakes</Link><Link href="/planner">Planner</Link></nav></header><Step7ExerciseClient exercise={lesson.exercise} voiceText={lesson.voiceText} nextHref={next ? `/listen/advanced/${next.slug}` : "/planner"} nextLabel={next ? "Next listening level" : "Build my plan"}/></main><SiteFooter/></>;
}
