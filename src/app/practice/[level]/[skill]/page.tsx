import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PracticeClient from "./practice-client";
import { StudyPage } from "../../../components/study-shell";

export const metadata: Metadata = {
  title: "HSK 3.0 Practice — HSKKit",
  description: "Complete a resumable, versioned HSK 3.0 skill practice session with immediate feedback.",
  robots: { index: false, follow: false },
};

export default async function PracticePage({ params, searchParams }: { params: Promise<{ level: string; skill: string }>; searchParams: Promise<{ dailySessionId?: string; dailyItemId?: string }> }) {
  const { level: rawLevel, skill } = await params;
  const { dailySessionId, dailyItemId } = await searchParams;
  const level = Number(rawLevel);
  if (!Number.isInteger(level) || level < 1 || level > 9 || !/^[a-z-]+$/.test(skill)) notFound();
  return <StudyPage><PracticeClient level={level} skill={skill} dailySessionId={dailySessionId} dailyItemId={dailyItemId} /></StudyPage>;
}
