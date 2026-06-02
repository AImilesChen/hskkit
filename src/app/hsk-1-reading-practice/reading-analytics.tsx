"use client";

import { useEffect } from "react";
import { trackEvent, AnalyticsEvents } from "../../lib/analytics";

export function ReadingAnalytics() {
  useEffect(() => {
    // Track reading_start when user lands on the page
    trackEvent(AnalyticsEvents.reading_start);

    // Track story view when user scrolls to a story section
    const storyObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const storyId = entry.target.id;
            if (storyId?.startsWith("story-")) {
              trackEvent(AnalyticsEvents.reading_story_view, {
                story_id: storyId,
              });
            }
          }
        });
      },
      { threshold: 0.3 }
    );

    const storyElements = document.querySelectorAll("[id^='story-']");
    storyElements.forEach((el) => storyObserver.observe(el));

    // Track vocab tap on mobile / click on desktop
    const handleVocabTap = (e: Event) => {
      const target = e.target as HTMLElement;
      const vocabChip = target.closest("[data-vocab]");
      if (vocabChip) {
        const hanzi = vocabChip.getAttribute("data-vocab");
        if (hanzi) {
          trackEvent(AnalyticsEvents.reading_vocab_tap, {
            hanzi,
          });
        }
      }
    };

    document.addEventListener("click", handleVocabTap);
    document.addEventListener("touchend", handleVocabTap);

    return () => {
      storyObserver.disconnect();
      document.removeEventListener("click", handleVocabTap);
      document.removeEventListener("touchend", handleVocabTap);
    };
  }, []);

  return null;
}
