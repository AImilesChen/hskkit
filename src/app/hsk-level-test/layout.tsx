import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quick HSK Level Check | HSKKit",
  description:
    "Answer 8 short questions to estimate your HSK level. Get a suggested study path with vocabulary and practice recommendations.",
  alternates: {
    canonical: "https://hskkit.com/hsk-level-test",
  },
};

export default function LevelTestLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
