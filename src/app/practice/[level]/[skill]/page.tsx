import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PracticeClient from "./practice-client";

export const metadata: Metadata = {
  title: "HSK 3.0 Practice — HSKKit",
  description: "Complete a resumable, versioned HSK 3.0 skill practice session with immediate feedback.",
  robots: { index: false, follow: false },
};

export default async function PracticePage({ params }: { params: Promise<{ level: string; skill: string }> }) {
  const { level: rawLevel, skill } = await params;
  const level = Number(rawLevel);
  if (!Number.isInteger(level) || level < 1 || level > 9 || !/^[a-z-]+$/.test(skill)) notFound();
  return <PracticeClient level={level} skill={skill} />;
}
