import type { Metadata } from "next";
import { PlausibleAnalytics } from "./components/plausible-analytics";
import "./globals.css";

const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || "hskkit.com";
const PLAUSIBLE_ENDPOINT = process.env.NEXT_PUBLIC_PLAUSIBLE_ENDPOINT || "https://plausible.shipsolo.io/api/event";

export const metadata: Metadata = {
  metadataBase: new URL("https://hskkit.com"),
  title: "HSKKit | Free HSK Vocabulary, Practice Tests & Level Guides",
  description:
    "Free HSK study guides with vocabulary lists, sample tests, and level-by-level roadmaps. Start with a quick self-check and know what to study next.",
  alternates: {
    canonical: "https://hskkit.com",
  },
  openGraph: {
    title: "Prepare for Your HSK Exam with Free Study Guides & Practice Tests",
    description:
      "Free HSK vocabulary lists, sample tests, and level guides for Chinese learners. Take the self-check and start studying today.",
    url: "https://hskkit.com",
    siteName: "HSKKit",
    type: "website",
    images: [{
      url: "/og-image.png",
      width: 1200,
      height: 630,
      alt: "HSKKit - Free HSK Study Guides",
    }],
  },
  twitter: { 
    card: "summary_large_image",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", type: "image/png", sizes: "32x32" },
      { url: "/icon.png", type: "image/png", sizes: "192x192" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="https://hskkit.com/site.webmanifest" />
        <link rel="icon" href="https://hskkit.com/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="https://hskkit.com/favicon-32x32.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="https://hskkit.com/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Serif+SC:wght@400;600;700&family=Source+Serif+4:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <PlausibleAnalytics domain={PLAUSIBLE_DOMAIN} endpoint={PLAUSIBLE_ENDPOINT} />
      </body>
    </html>
  );
}
