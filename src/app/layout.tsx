import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://hskkit.com"),
  title: "HSKKit — AI Chinese Learning Tools for HSK Learners",
  description: "Generate HSK worksheets, graded readings, and flashcards with AI-powered Chinese learning tools.",
  openGraph: {
    title: "HSKKit — AI Chinese Learning Tools",
    description: "Practical AI tools for HSK learners: worksheets, graded reading, and flashcards.",
    url: "https://hskkit.com",
    siteName: "HSKKit",
    type: "website"
  },
  twitter: { card: "summary_large_image" }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
