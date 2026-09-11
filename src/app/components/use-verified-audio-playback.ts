"use client";

import { useRef, useState } from "react";
import {
  PlaybackVerificationCoordinator,
  playbackErrorCode,
  playbackVerificationMessage,
  type PlaybackTicket,
  type PlaybackVerificationPhase,
  type PlaybackVerificationState,
} from "../../lib/learning/verified-playback";

type Options = {
  context: string;
  start: () => Promise<PlaybackTicket>;
  complete: (ticket: string) => Promise<void>;
  onVerified?: (ticket: string) => void;
  onMessage?: (message: string, code?: string) => void;
};

export function useVerifiedAudioPlayback(options: Options) {
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const [state, setState] = useState<PlaybackVerificationState>("idle");
  const [verified, setVerified] = useState(false);
  const coordinatorRef = useRef<PlaybackVerificationCoordinator | null>(null);

  if (!coordinatorRef.current) {
    coordinatorRef.current = new PlaybackVerificationCoordinator({
      start: () => optionsRef.current.start(),
      complete: (ticket) => optionsRef.current.complete(ticket),
      onStateChange: setState,
    });
  }

  function report(error: unknown, phase: PlaybackVerificationPhase) {
    const code = playbackErrorCode(error);
    console.warn("[playback-verification]", { context: optionsRef.current.context, phase, code });
    optionsRef.current.onMessage?.(playbackVerificationMessage(code, phase), code);
  }

  async function beforePlay() {
    setVerified(false);
    optionsRef.current.onMessage?.("");
    try {
      return await coordinatorRef.current!.prepare();
    } catch (error) {
      report(error, "start");
      return false;
    }
  }

  async function onComplete() {
    try {
      const completed = await coordinatorRef.current!.finish();
      if (!completed) return;
      setVerified(true);
      const ticket = coordinatorRef.current!.snapshot().ticket;
      if (ticket) optionsRef.current.onVerified?.(ticket);
    } catch (error) {
      setVerified(false);
      report(error, "complete");
    }
  }

  function onFailure() {
    coordinatorRef.current!.fail();
    setVerified(false);
    optionsRef.current.onMessage?.("Audio playback failed. Retry the recording before answering.", "AUDIO_ASSET_UNAVAILABLE");
  }

  function reset() {
    coordinatorRef.current!.reset();
    setVerified(false);
  }

  return {
    beforePlay,
    onComplete,
    onFailure,
    reset,
    state,
    verified,
    verifying: state === "preparing" || state === "verifying",
    ticket: coordinatorRef.current.snapshot().ticket,
  };
}
