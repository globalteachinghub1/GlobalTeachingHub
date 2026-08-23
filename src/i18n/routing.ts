import { defineRouting } from "next-intl/routing";

export const locales = ["en", "ur", "ar", "es", "de", "fr"] as const;
export type Locale = (typeof locales)[number];

export const RTL_LOCALES: readonly Locale[] = ["ur", "ar"];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  ur: "اردو",
  ar: "العربية",
  es: "Español",
  de: "Deutsch",
  fr: "Français",
};

export const routing = defineRouting({
  locales,
  defaultLocale: "en",
  // English stays at "/", "/about", etc. — no "/en" prefix — so existing
  // URLs and search-engine indexing are unaffected. Other locales get their
  // own prefix, e.g. "/ur/about".
  localePrefix: "as-needed",
});
