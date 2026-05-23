import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://hskkit.com"),
  title: "HSKKit | HSK Study Guides and Practice Resources",
  description:
    "Explore HSK vocabulary, practice test, level guide, and Chinese learning resources for practical study planning.",
  openGraph: {
    title: "HSKKit | HSK Study Guides",
    description:
      "Practical HSK vocabulary, practice test, and level guide resources for Chinese learners.",
    url: "https://hskkit.com",
    siteName: "HSKKit",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
