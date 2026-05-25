import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { GA_ID, CLARITY_ID, AHREFS_ID } from "@/lib/analytics";

export const metadata: Metadata = {
  metadataBase: new URL("https://hskkit.com"),
  title: "HSKKit | HSK Study Guides and Practice Resources",
  description:
    "Explore HSK vocabulary, practice test, level guide, and Chinese learning resources for practical study planning.",
  alternates: {
    canonical: "https://hskkit.com",
  },
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Serif+SC:wght@400;600;700&family=Source+Serif+4:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
      {GA_ID && (
        <>
          <Script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', { page_path: window.location.pathname });
            `}
          </Script>
        </>
      )}
      {CLARITY_ID && (
        <Script id="clarity-init" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${CLARITY_ID}");
          `}
        </Script>
      )}
      {AHREFS_ID && (
        <Script
          async
          src={`https://analytics.ahrefs.com/analytics.js`}
          data-key={AHREFS_ID}
          strategy="afterInteractive"
        />
      )}
    </html>
  );
}
