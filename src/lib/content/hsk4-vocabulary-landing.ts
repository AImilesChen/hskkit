import landing from "./hsk4-vocabulary-landing.json" with { type: "json" };
import { formalWordAudioUrlByContentId, getHsk3LevelStatus } from "./level-status.ts";
import type { CatalogResponse } from "../../app/vocabulary/[level]/vocabulary-catalog";

export const hsk4VocabularyTopics = landing.topics;

export function getHsk4VocabularyInitialPage(): CatalogResponse {
  const total = getHsk3LevelStatus(4).wordCount;
  return {
    contentAssets: landing.firstPage.map((word) => ({ ...word, level: 4,
      formalAudioAvailable: formalWordAudioUrlByContentId.has(word.id),
      formalAudioUrl: formalWordAudioUrlByContentId.get(word.id) ?? null,
    })),
    pagination: { page: 1, pageSize: 50, total, totalPages: Math.ceil(total / 50),
      hasPrevious: false, hasNext: total > 50 },
  };
}
