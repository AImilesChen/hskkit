"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { LearningTopic } from "@/lib/topics/catalog";
import { TopicLearningPanel } from "./topic-learning-panel";

export function TopicLessons({ topic, children }: { topic: LearningTopic; children: ReactNode[] }) {
  const lessons = useMemo(() => topic.lessons ?? [], [topic.lessons]);
  const [active, setActive] = useState(lessons[0]?.id ?? "");
  const workspace = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function followHash() {
      const lesson = lessons.find((item) => `#lesson-${item.id}` === window.location.hash);
      if (lesson) setActive(lesson.id);
      else if (!window.location.hash) setActive(lessons[0]?.id ?? "");
    }
    followHash();
    window.addEventListener("hashchange", followHash);
    return () => window.removeEventListener("hashchange", followHash);
  }, [lessons]);

  useEffect(() => {
    // A hidden lesson must never keep playing behind the selected lesson.
    window.dispatchEvent(new Event("topic-lesson-change"));
    workspace.current?.querySelectorAll<HTMLAudioElement>("[hidden] audio").forEach((audio) => audio.pause());
    if (window.location.hash === `#lesson-${active}`) {
      document.getElementById(`lesson-${active}`)?.scrollIntoView({ block: "start" });
    }
  }, [active]);

  return <div className="topics-workspace" ref={workspace}>
    <div className="topics-progress-strip"><TopicLearningPanel topic={topic} lessonId={active} compact /></div>
    <div className="topics-course">
      <nav className="topics-lesson-nav" aria-label="Topic lessons">
        {lessons.map((lesson, index) => <a key={lesson.id} href={`#lesson-${lesson.id}`} aria-current={active === lesson.id ? "step" : undefined} onClick={() => setActive(lesson.id)}>
          <span className="topics-step">{index + 1}</span><span><strong>{lesson.title}</strong><small>{lesson.wordAssetIds.length} words</small></span>
        </a>)}
      </nav>
      {lessons.map((lesson, index) => <div key={lesson.id} hidden={active !== lesson.id}>{children[index]}</div>)}
    </div>
  </div>;
}
