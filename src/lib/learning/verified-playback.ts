export type PlaybackVerificationPhase = "start" | "complete";
export type PlaybackVerificationState = "idle" | "preparing" | "playing" | "paused" | "verifying" | "verified" | "error";
export type PlaybackTicket = { playbackTicket: string; notBefore?: string };

type Clock = {
  now?: () => number;
  sleep?: (milliseconds: number) => Promise<void>;
};

const defaultSleep = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

export async function waitForPlaybackWindow(notBefore?: string, clock: Clock = {}) {
  if (!notBefore) return;
  const target = Date.parse(notBefore);
  if (!Number.isFinite(target)) return;
  const now = clock.now ?? Date.now;
  const remaining = Math.max(0, target - now());
  if (remaining > 0) await (clock.sleep ?? defaultSleep)(remaining);
}

export class PlaybackRequestError extends Error {
  readonly code: string;

  constructor(code: string, message?: string) {
    super(message || code);
    this.name = "PlaybackRequestError";
    this.code = code;
  }
}

export function playbackErrorCode(error: unknown) {
  if (error instanceof PlaybackRequestError) return error.code;
  if (error instanceof TypeError) return "NETWORK_ERROR";
  if (error instanceof Error && /^[A-Z][A-Z0-9_]+$/.test(error.message)) return error.message;
  return "UNKNOWN_ERROR";
}

export function playbackVerificationMessage(code: string, phase: PlaybackVerificationPhase) {
  if (code === "AUDIO_PLAYBACK_INCOMPLETE") return "Playback finished. Verification needs another moment; please retry the recording if it does not complete.";
  if (code === "AUDIO_PLAYBACK_TICKET_EXPIRED" || code === "AUDIO_PLAYBACK_TICKET_INVALID" || code === "AUDIO_PLAYBACK_REQUIRED") {
    return "Playback verification expired. Replay the full recording before answering.";
  }
  if (code === "AUDIO_ASSET_UNAVAILABLE" || code === "INVALID_AUDIO_PLAYBACK" || code === "INVALID_AUDIO_REVIEW") {
    return "This recording is temporarily unavailable. Try another activity and return later.";
  }
  if (code === "NETWORK_ERROR") return phase === "start"
    ? "The recording could not start because of a connection problem. Retry playback."
    : "Playback finished, but the connection interrupted verification. Retry playback.";
  return phase === "start"
    ? "Playback could not start. Retry the recording."
    : "Playback could not be verified. Replay the full recording before answering; no mastery was changed.";
}

type CoordinatorDependencies = Clock & {
  start: () => Promise<PlaybackTicket>;
  complete: (ticket: string) => Promise<void>;
  onStateChange?: (state: PlaybackVerificationState) => void;
};

export class PlaybackVerificationCoordinator {
  private cycle = 0;
  private state: PlaybackVerificationState = "idle";
  private active?: PlaybackTicket;
  private readonly dependencies: CoordinatorDependencies;

  constructor(dependencies: CoordinatorDependencies) {
    this.dependencies = dependencies;
  }

  snapshot() {
    return { state: this.state, ticket: this.active?.playbackTicket, notBefore: this.active?.notBefore };
  }

  private transition(state: PlaybackVerificationState) {
    this.state = state;
    this.dependencies.onStateChange?.(state);
  }

  async prepare() {
    if (this.state === "preparing" || this.state === "playing" || this.state === "paused" || this.state === "verifying") return false;
    const cycle = ++this.cycle;
    this.active = undefined;
    this.transition("preparing");
    try {
      const started = await this.dependencies.start();
      if (cycle !== this.cycle) return false;
      if (!started.playbackTicket) throw new PlaybackRequestError("AUDIO_PLAYBACK_REQUIRED");
      this.active = started;
      this.transition("playing");
      return true;
    } catch (error) {
      if (cycle === this.cycle) this.transition("error");
      throw error;
    }
  }

  pause() {
    if (this.state === "playing") this.transition("paused");
  }

  resume() {
    if (this.state !== "paused" || !this.active) return false;
    this.transition("playing");
    return true;
  }

  async finish() {
    if (!this.active || (this.state !== "playing" && this.state !== "paused")) return false;
    const cycle = this.cycle;
    const ticket = this.active;
    this.transition("verifying");
    try {
      await waitForPlaybackWindow(ticket.notBefore, this.dependencies);
      if (cycle !== this.cycle) return false;
      await this.dependencies.complete(ticket.playbackTicket);
      if (cycle !== this.cycle) return false;
      this.transition("verified");
      return true;
    } catch (error) {
      if (cycle === this.cycle) this.transition("error");
      throw error;
    }
  }

  fail() {
    this.cycle += 1;
    this.active = undefined;
    this.transition("error");
  }

  reset() {
    this.cycle += 1;
    this.active = undefined;
    this.transition("idle");
  }
}
