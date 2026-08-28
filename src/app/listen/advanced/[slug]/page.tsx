import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Step7ExerciseClient from "@/app/components/step7-exercise";
import SiteFooter from "@/app/site-footer";
import SiteHeader from "@/app/site-header";
import { ADVANCED_LISTENING_LESSONS, advancedListeningBySlug } from "@/lib/learning/step7-content";
import { listeningQuestionBySlug, listeningSession, type ListeningLibrarySize } from "@/lib/learning/listening-library";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ size?: string; seed?: string; position?: string }> };
export function generateStaticParams() { return ADVANCED_LISTENING_LESSONS.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lesson = advancedListeningBySlug((await params).slug);
  return lesson ? { title: `${lesson.title} | HSKKit Listening`, robots: { index: false, follow: false } } : { title: "Listening unavailable | HSKKit" };
}
export default async function AdvancedListeningPage({ params, searchParams }: Props) {
  const slug = (await params).slug;
  const lesson = advancedListeningBySlug(slug);
  if (!lesson) notFound();
  const libraryQuestion = listeningQuestionBySlug(slug);
  const query = await searchParams;
  const size: ListeningLibrarySize = query.size === "20" ? 20 : 10;
  const seed = /^[a-zA-Z0-9_-]{1,40}$/.test(query.seed ?? "") ? query.seed! : "default";
  const requestedPosition = Number.parseInt(query.position ?? "0", 10);
  const position = Number.isInteger(requestedPosition) && requestedPosition >= 0 && requestedPosition < size ? requestedPosition : 0;
  const session = listeningSession(lesson.level, size, seed);
  const sessionPosition = libraryQuestion && session.questions[position]?.slug === slug ? position : libraryQuestion ? session.questions.findIndex((question) => question.slug === slug) : -1;
  const activePosition = sessionPosition >= 0 ? sessionPosition : 0;
  const next = libraryQuestion ? session.questions[activePosition + 1] : session.questions[0];
  const nextHref = next ? `/listen/advanced/${next.slug}?size=${size}&seed=${seed}&position=${libraryQuestion ? activePosition + 1 : 0}` : `/listen/results?level=${lesson.level}&size=${size}&seed=${seed}`;
  const nextLabel = next ? `Continue HSK ${lesson.level} · ${libraryQuestion ? activePosition + 2 : 1} of ${size}` : "View session result";
  return <><SiteHeader/><main className="learn step7-page"><header><span className="eyebrow">Listening · HSK {lesson.level}{libraryQuestion ? ` · ${activePosition + 1} of ${size}` : ""}</span><h1>{lesson.title}</h1><p>{lesson.instruction}</p><nav aria-label="Learning navigation"><Link href="/listen">All listening</Link><Link href="/review">Review</Link><Link href="/mistakes">Mistakes</Link><Link href="/planner">Planner</Link></nav></header><Step7ExerciseClient exercise={lesson.exercise} voiceText={lesson.voiceText} audioSrc={lesson.audioSrc} nextHref={nextHref} nextLabel={nextLabel} listeningSession={libraryQuestion ? { level: lesson.level, size, seed, position: activePosition } : undefined}/></main><SiteFooter/></>;
}
