import { getHsk3LevelStatuses } from "../content/level-status.ts";
import type { GrowthLevelTotal } from "./growth.ts";

export function releaseVocabularyTotals(): GrowthLevelTotal[] {
  const statuses = getHsk3LevelStatuses();
  const foundation = statuses
    .filter((status) => status.level >= 1 && status.level <= 6)
    .map((status) => ({
      level: status.level,
      label: `HSK ${status.level}`,
      total: status.wordCount,
    }));
  const advancedTotal = statuses.find((status) => status.level === 7)?.wordCount ?? 0;
  return [...foundation, { level: 7, label: "HSK 7–9", total: advancedTotal }];
}