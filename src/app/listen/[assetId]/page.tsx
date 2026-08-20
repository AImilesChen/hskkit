import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AudioExerciseClient from "../../components/audio-exercise";
import SiteFooter from "../../site-footer";
import SiteHeader from "../../site-header";
import { listAudioAssets, trustedAudioExercise, type AudioMode } from "@/lib/learning/audio";

type Props = { params: Promise<{ assetId: string }>; searchParams: Promise<{ mode?: string }> };
export function generateStaticParams() { return listAudioAssets().map((word) => ({ assetId: word.id })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { assetId } = await params;
  const word = listAudioAssets().find((candidate) => candidate.id === assetId);
  return word ? { title: `${word.hanzi} Listening Practice | HSKKit`, robots: { index: false, follow: false } } : { title: "Audio unavailable | HSKKit", robots: { index: false, follow: false } };
}
export default async function ListenAssetPage({ params, searchParams }: Props) {
  const { assetId } = await params;
  const requestedMode = (await searchParams).mode;
  const initialMode: AudioMode = requestedMode === "context_audio" ? "context_audio" : "audio";
  const audio = trustedAudioExercise(assetId, "audio");
  const contextAudio = trustedAudioExercise(assetId, "context_audio");
  if (!audio || !contextAudio) notFound();
  return <><SiteHeader /><AudioExerciseClient exercises={{ audio, context_audio: contextAudio }} initialMode={initialMode} /><SiteFooter /></>;
}
