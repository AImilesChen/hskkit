import type { Metadata } from "next";
import SiteFooter from "../../../site-footer";
import SiteHeader from "../../../site-header";
import PlacementResultClient from "./placement-result-client";

export const metadata: Metadata = {
  title: "Placement learning suggestion — HSKKit",
  description: "A private HSKKit learning-level suggestion with evidence and uncertainty.",
  robots: { index: false, follow: false },
};

export default async function PlacementResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <SiteHeader />
      <PlacementResultClient resultId={id} />
      <SiteFooter />
    </>
  );
}
