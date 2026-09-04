"use client";

import Link from "next/link";
import { AnalyticsEvents, trackEvent } from "@/lib/analytics";
import type { BlogLearningAction } from "@/lib/blog/learning-actions";

export default function BlogActionLink({ action, articleSlug, hskLevel, compact = false }: {
  action: BlogLearningAction;
  articleSlug: string;
  hskLevel?: number;
  compact?: boolean;
}) {
  return <Link
    href={action.href}
    className={`${compact ? "blog-action-compact" : "blog-action"} ${action.emphasis === "primary" ? "blog-action-primary" : "blog-action-secondary"}`}
    onClick={() => trackEvent(AnalyticsEvents.blog_learning_action, {
      articleSlug: articleSlug.slice(0, 100),
      action: action.id,
      hskLevel: hskLevel ?? "all",
    })}
  >
    <span><strong>{action.label}</strong>{!compact && <small>{action.description}</small>}</span>
    <span aria-hidden="true">→</span>
  </Link>;
}
