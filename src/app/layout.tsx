import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { GA_ID, CLARITY_ID, AHREFS_ID } from "@/lib/analytics";

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
