export type PreviewRating = "retry" | "known";
export type PreviewSession = {
  order: number[];
  cursor: number;
  round: number;
  ratings: Record<number, PreviewRating>;
  complete: boolean;
};

export function createPreviewSession(count: number): PreviewSession {
  return { order: Array.from({ length: count }, (_, index) => index), cursor: 0, round: 1, ratings: {}, complete: count === 0 };
}

/** A preview revisits uncertain words once; further rounds are the learner's choice. */
export function ratePreview(session: PreviewSession, rating: PreviewRating): PreviewSession {
  if (session.complete) return session;
  const ratings = { ...session.ratings, [session.order[session.cursor]]: rating };
  if (session.cursor < session.order.length - 1) return { ...session, ratings, cursor: session.cursor + 1 };
  const retry = session.order.filter((index) => ratings[index] === "retry");
  return session.round === 1 && retry.length
    ? { ...session, ratings, order: retry, cursor: 0, round: 2 }
    : { ...session, ratings, complete: true };
}

export function repeatUncertain(session: PreviewSession): PreviewSession {
  const order = Object.entries(session.ratings).filter(([, rating]) => rating === "retry").map(([index]) => Number(index));
  return order.length ? { ...session, order, cursor: 0, round: session.round + 1, complete: false } : session;
}

/** Keep visited positions stable, shuffling only the unseen part of this round. */
export function shufflePreview(session: PreviewSession, random: () => number): PreviewSession {
  const order = [...session.order];
  for (let index = order.length - 1; index > session.cursor; index -= 1) {
    const target = session.cursor + Math.floor(random() * (index - session.cursor + 1));
    [order[index], order[target]] = [order[target], order[index]];
  }
  return { ...session, order };
}
