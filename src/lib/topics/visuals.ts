export type TopicCategoryVisual = {
  accentName: "morning" | "table" | "journey";
  label: string;
  surface: string;
  softSurface: string;
  border: string;
  text: string;
  mutedText: string;
  iconSurface: string;
  iconText: string;
  line: string;
};

export const topicCategoryVisuals: Record<string, TopicCategoryVisual> = {
  "daily-life": {
    accentName: "morning",
    label: "Daily rhythm",
    surface: "bg-amber-50",
    softSurface: "bg-gradient-to-br from-amber-50 via-orange-50 to-sky-50",
    border: "border-amber-200",
    text: "text-amber-950",
    mutedText: "text-amber-800",
    iconSurface: "bg-amber-100",
    iconText: "text-amber-700",
    line: "bg-amber-400",
  },
  "food-drink": {
    accentName: "table",
    label: "Food moments",
    surface: "bg-rose-50",
    softSurface: "bg-gradient-to-br from-rose-50 via-orange-50 to-lime-50",
    border: "border-rose-200",
    text: "text-rose-950",
    mutedText: "text-rose-800",
    iconSurface: "bg-rose-100",
    iconText: "text-rose-700",
    line: "bg-rose-400",
  },
  "travel-transport": {
    accentName: "journey",
    label: "Travel flow",
    surface: "bg-cyan-100",
    softSurface: "bg-gradient-to-br from-cyan-100 via-sky-50 to-teal-100",
    border: "border-cyan-300",
    text: "text-cyan-950",
    mutedText: "text-cyan-800",
    iconSurface: "bg-cyan-200",
    iconText: "text-cyan-800",
    line: "bg-cyan-500",
  },
};

export const topicIconNames: Record<string, string> = {
  "morning-routine": "sunrise",
  "time-and-plans": "calendar-clock",
  "weather-and-seasons": "sun-cloud",
  "restaurant-basics": "menu-bowl",
  "grocery-shopping": "shopping-basket",
  "cooking-at-home": "cooking-pan",
  "departure-and-arrival": "departure-ticket",
  "getting-around-town": "transit-route",
  "hotel-stay": "hotel-key",
};

export const categoryIconNames: Record<string, string> = {
  "daily-life": "home-sun",
  "food-drink": "bowl-chopsticks",
  "travel-transport": "map-route",
};

export function topicVisualFor(categorySlug: string) {
  return topicCategoryVisuals[categorySlug] ?? topicCategoryVisuals["daily-life"];
}

export function topicIconFor(topicSlug: string) {
  return topicIconNames[topicSlug] ?? "sunrise";
}
