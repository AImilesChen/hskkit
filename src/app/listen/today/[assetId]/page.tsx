import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AudioExerciseClient from "../../../components/audio-exercise";
import SiteFooter from "../../../site-footer";
import SiteHeader from "../../../site-header";
import { publicAudioExercise, trustedTodayAudioExercise, type AudioMode } from "@/lib/learning/audio";

export const dynamic = "force-dynamic";
type Props = {
  params: Promise<{ assetId: string }>;
  searchParams: Promise<{ mode?: string; dailySessionId?: string; dailyItemId?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { assetId } = await params;
  const exercise = trustedTodayAudioExercise(assetId, "audio");
  return exercise
    ? { title: `HSK ${exercise.word.level} Today Listening | HSKKit`, robots: { index: false, follow: false } }
    : { title: "Daily audio unavailable | HSKKit", robots: { index: false, follow: false } };
}

export default async function TodayListenPage({ params, searchParams }: Props) {
  const { assetId } = await params;
  const query = await searchParams;
  const initialMode: AudioMode = query.mode === "context_audio" ? "context_audio" : "audio";
  const audio = trustedTodayAudioExercise(assetId, "audio");
  const contextAudio = trustedTodayAudioExercise(assetId, "context_audio");
  const exercises = {
    ...(audio ? { audio: publicAudioExercise(audio) } : {}),
    ...(contextAudio ? { context_audio: publicAudioExercise(contextAudio) } : {}),
  };
  if (!exercises[initialMode]) notFound();
  return <>
    <SiteHeader />
    <AudioExerciseClient
      exercises={exercises}
      initialMode={initialMode}
      dailySessionId={query.dailySessionId}
      dailyItemId={query.dailyItemId}
    />
    <SiteFooter />
  </>;
}
