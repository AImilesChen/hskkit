import type { Metadata } from "next";
import SiteFooter from "../site-footer";
import SiteHeader from "../site-header";
import PlacementClient from "./placement-client";

export const metadata: Metadata = {
  title: "HSK 3.0 Placement Diagnostic — HSKKit",
  description: "Get a low-confidence HSK 3.0 learning-level suggestion from a resumable nine-question diagnostic. Not an official HSK score.",
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
