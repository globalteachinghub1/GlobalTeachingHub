import type { Metadata } from "next";
import { routing, type Locale } from "@/i18n/routing";

export const SITE_NAME = "Global Teaching Hub";
export const SITE_URL = (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
export const SITE_DESCRIPTION =
  "Live one-to-one classes, experienced teachers, flexible schedules, and personalized learning for students from Pakistan and around the world.";

/**
 * English (the default locale) has no URL prefix; other locales do.
 * Never returns a trailing slash (e.g. the Urdu home page is "/ur", not
 * "/ur/" — the latter 308-redirects to the former, which is the wrong
 * thing for a canonical/hreflang/sitemap URL to point at).
 */
export function localizedPath(locale: string, path: string) {
  if (locale === routing.defaultLocale) return path;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

/** IETF/OG-style locale tags (og:locale wants "en_US", not bare "en"). */
const OG_LOCALE: Record<Locale, string> = {
  en: "en_US",
  ur: "ur_PK",
  ar: "ar_SA",
  es: "es_ES",
  de: "de_DE",
  fr: "fr_FR",
};

/**
 * Consistent title/description/canonical/hreflang/OG/Twitter metadata for a
 * public marketing page. `path` is the route relative to the site root
 * (locale-neutral, e.g. "/about"); `locale` is the page's current locale.
 */
export function buildMetadata({
  title,
  description,
  path,
  locale,
}: {
  title: string;
  description: string;
  path: string;
  locale: Locale;
}): Metadata {
  const url = `${SITE_URL}${localizedPath(locale, path)}`;
  const languages = Object.fromEntries(
    routing.locales.map((l) => [l, `${SITE_URL}${localizedPath(l, path)}`])
  );
  languages["x-default"] = `${SITE_URL}${path}`;

  return {
    title,
    description,
    alternates: { canonical: url, languages },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      locale: OG_LOCALE[locale],
      alternateLocale: routing.locales.filter((l) => l !== locale).map((l) => OG_LOCALE[l]),
      images: [{ url: `${SITE_URL}/logo-full.png` }],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [`${SITE_URL}/logo-full.png`],
    },
  };
}
