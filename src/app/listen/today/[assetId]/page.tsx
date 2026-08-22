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
    ? { title: `${exercise.word.hanzi} Today Listening | HSKKit`, robots: { index: false, follow: false } }
    : { title: "Daily audio unavailable | HSKKit", robots: { index: false, follow: false } };
}

export default async function TodayListenPage({ params, searchParams }: Props) {
  const { assetId } = await params;
  const query = await searchParams;
  const initialMode: AudioMode = query.mode === "context_audio" ? "context_audio" : "audio";
  const audio = trustedTodayAudioExercise(assetId, "audio");
  const contextAudio = trustedTodayAudioExercise(assetId, "context_audio");
  if (!audio || !contextAudio) notFound();
  return <>
    <SiteHeader />
    <AudioExerciseClient
      exercises={{ audio: publicAudioExercise(audio), context_audio: publicAudioExercise(contextAudio) }}
      initialMode={initialMode}
      dailySessionId={query.dailySessionId}
      dailyItemId={query.dailyItemId}
    />
    <SiteFooter />
  </>;
}
