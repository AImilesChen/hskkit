// One photographic cover per topic. Source and license records are kept in
// public/images/topics/credits.json; images are served locally as compressed WebP.
const topicCoverNames = [
  "morning-routine", "time-and-plans", "weather-and-seasons",
  "restaurant-basics", "grocery-shopping", "cooking-at-home",
  "departure-and-arrival", "getting-around-town", "hotel-stay",
  "home-chores", "cafe-and-drinks", "travel-problems",
] as const;

const topicCoverSlugs = new Set<string>(topicCoverNames);

export function topicCoverFor(topicSlug: string) {
  return topicCoverSlugs.has(topicSlug) ? `/images/topics/${topicSlug}.webp` : undefined;
}
