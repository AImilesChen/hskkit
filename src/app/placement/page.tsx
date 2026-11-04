import type { Metadata } from "next";
import SiteFooter from "../site-footer";
import SiteHeader from "../site-header";
import PlacementClient from "./placement-client";

export const metadata: Metadata = {
  title: "HSK 3.0 Placement Diagnostic — HSKKit",
  description: "Complete an adaptive 18–24-question HSK learning diagnostic across vocabulary, grammar, reading and listening. Resume saved progress and get a starting-level suggestion, not an official score.",
  alternates: { canonical: "/placement" },
  robots: { index: false, follow: true },
};

export default function PlacementPage() {
  return (
    <>
      <SiteHeader />
      <PlacementClient />
      <SiteFooter />
    </>
  );
}
