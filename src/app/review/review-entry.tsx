"use client";

import { useSearchParams } from 'next/navigation';
import LearningDashboard from '../components/learning-dashboard';
import { reviewEntryContextKey } from '@/lib/learning/review-workbench';

export default function ReviewEntry() {
  const search = useSearchParams();
  // A source switch must restore its own queue. Scope and local round updates keep the active workspace.
  return <LearningDashboard key={reviewEntryContextKey(search.toString())} mode="review"/>;
}
