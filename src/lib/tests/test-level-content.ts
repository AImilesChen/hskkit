import { publishedGrammarLessons, publishedReadingLessons } from "../learning/step7-content.ts";
import type { TestLevel } from "./test-levels.ts";

export function testLevelContent(level: TestLevel) {
  const grammar = publishedGrammarLessons.find(lesson => lesson.level === level.level);
  const reading = publishedReadingLessons.find(lesson => lesson.level === level.level);
  if (!grammar || !reading) throw new Error(`Missing published test examples for ${level.slug}`);
  return {
    grammar,
    reading,
    samples: [
      { skill: "Grammar", exercise: grammar.exercise, context: undefined },
      { skill: "Reading", exercise: reading.exercise, context: reading.text },
    ],
    resources: [
      { title: `${level.label} vocabulary`, description: "Review words, pinyin and meanings.", href: `/vocabulary/${level.level}` },
      { title: grammar.title, description: "Review a published grammar pattern at this level.", href: `/grammar/${grammar.slug}` },
      { title: reading.title, description: "Read a complete passage before answering a question.", href: `/reading/${reading.slug}` },
      { title: `${level.label} listening practice`, description: "Practise the listening skill at this level.", href: `/practice/${level.level}/listening` },
    ],
  };
}
