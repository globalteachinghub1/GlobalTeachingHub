import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";

export const SITE_NAME = "Global Teaching Hub";
/**
 * Public origin used for canonical/hreflang/sitemap/OG/email links. Set
 * SITE_URL explicitly in every deployed environment; on Vercel we fall back
 * to the project's production domain so a missing env var can never leak
 * "localhost" URLs into production metadata.
 */
export const SITE_URL = (
  process.env.SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/$/, "");
/** English fallbacks; per-locale copies live in the "Seo" messages namespace. */
export const SITE_TITLE = `Online Quran & Arabic Classes | ${SITE_NAME}`;
export const SITE_DESCRIPTION =
  "Live one-to-one online Quran with Tajweed, Arabic and Islamic Studies classes with experienced teachers and flexible schedules. Book a free demo today.";

/** Default social-share card, served by src/app/og-image.png/route.tsx. */
export const OG_IMAGE = {
  url: `${SITE_URL}/og-image.png`,
  width: 1200,
  height: 630,
  alt: `${SITE_NAME} — live one-to-one online classes`,
};

export const SITE_KEYWORDS = [
  "online Quran classes",
  "learn Quran with Tajweed online",
  "online Quran teacher",
  "Quran translation classes online",
  "online Arabic classes",
  "online Islamic Studies classes",
  "one-to-one online classes",
  "live online classes",
  "online tutoring",
  SITE_NAME,
];

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
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE.url],
    },
  };
}

/**
 * buildMetadata() for a static marketing page whose localized title and
 * description are the `${key}Title` / `${key}Description` entries of the
 * "Seo" messages namespace.
 */
export async function pageMetadata(locale: Locale, key: string, path: string): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "Seo" });
  return buildMetadata({
    title: t(`${key}Title`),
    description: t(`${key}Description`),
    path,
    locale,
  });
}

/** schema.org BreadcrumbList for a page; `items` run from the site root down. */
export function breadcrumbJsonLd(locale: Locale, items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${localizedPath(locale, item.path)}`,
    })),
  };
}
