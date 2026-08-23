// Generated release slice for request-time Step 7 and AI paths.
// The Batch 13 contract verifies every entry against the fully validated catalog.
export const STEP7_RELEASE_ID = "hsk3-batch13-formal-learning-v4";

export const STEP7_PUBLISHED_CONTENT_LOGICAL_IDS = [
  "hsk3.grammar.basic-shi-negation",
  "hsk3.grammar.comparison-with-bi",
  "hsk3.grammar.ba-sentence-basics",
  "hsk3.grammar.condition-with-zhiyao",
  "hsk3.grammar.contrast-with-jinguan",
  "hsk3.grammar.formal-causation-yu-youyu",
  "hsk3.grammar.advanced-concession-guran",
  "hsk3.reading.family-weekend-plan",
  "hsk3.reading.weekend-travel-plan",
  "hsk3.reading.morning-study-routine",
  "hsk3.reading.library-evening-hours",
  "hsk3.reading.flexible-work-schedule",
  "hsk3.reading.community-renewal-debate",
  "hsk3.reading.evidence-and-policy-evaluation",
] as const;

export const STEP7_PUBLISHED_AUDIO_BY_LOGICAL_ID = {
  "hsk3.audio.word-mai": "audio/formal/word-mai-v1.mp3",
  "hsk3.audio.sentence-pronunciation": "audio/formal/sentence-pronunciation-v1.mp3",
  "hsk3.audio.context-morning-study": "audio/formal/context-morning-study-v1.mp3",
} as const;

const contentIds = new Set<string>(STEP7_PUBLISHED_CONTENT_LOGICAL_IDS);
export const isPublishedStep7Content = (logicalId: string) => contentIds.has(logicalId);
export const publishedStep7AudioSrc = (logicalId: string) => {
  const storageKey = STEP7_PUBLISHED_AUDIO_BY_LOGICAL_ID[logicalId as keyof typeof STEP7_PUBLISHED_AUDIO_BY_LOGICAL_ID];
  return storageKey ? `/${storageKey}` : undefined;
};
