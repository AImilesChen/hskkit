import './review-workbench.css';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import SiteHeader from '../site-header';
import SiteFooter from '../site-footer';
import ReviewEntry from './review-entry';

export const metadata: Metadata = { title: 'Review | HSKKit', robots: { index: false, follow: false } };

export default function Page() {
  return <><SiteHeader/><Suspense fallback={<main className="learn review-shell min-h-[70vh]" aria-busy="true"><h1>Review</h1><p>Preparing your review…</p></main>}><ReviewEntry/></Suspense><SiteFooter/></>;
}
