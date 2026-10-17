import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { SITE_NAME, SITE_URL, SITE_TITLE, SITE_DESCRIPTION, SITE_KEYWORDS, OG_IMAGE } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const TITLE = SITE_TITLE;

// GA4 measurement ID (e.g. "G-XXXXXXXXXX"). Unset → no analytics at all.
const GA_MEASUREMENT_ID = process.env.GA_MEASUREMENT_ID;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: SITE_KEYWORDS,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "education",
  // No site-wide canonical here: every page that inherited it (404s, portal
  // pages, any page without its own metadata) would declare the homepage as
  // its canonical. Public pages set their own via buildMetadata().
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE.url],
  },
  // Ownership-verification meta tags for Google Search Console and Bing
  // Webmaster Tools. Set the codes as env vars in the hosting dashboard;
  // unset vars render nothing.
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.BING_SITE_VERIFICATION
      ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION }
      : undefined,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The gtag scripts need the per-request CSP nonce. Only read headers when
  // analytics is enabled, so pages stay statically renderable otherwise.
  const nonce = GA_MEASUREMENT_ID ? (await headers()).get("x-nonce") ?? undefined : undefined;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
        <SpeedInsights />
      </body>
      {GA_MEASUREMENT_ID && <GoogleAnalytics gaId={GA_MEASUREMENT_ID} nonce={nonce} />}
    </html>
  );
}
