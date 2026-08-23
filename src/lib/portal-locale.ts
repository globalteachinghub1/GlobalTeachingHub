import { cookies } from "next/headers";
import { hasLocale } from "next-intl";
import { routing, type Locale } from "@/i18n/routing";

const COOKIE_NAME = "NEXT_LOCALE";

/**
 * Portals (student/parent dashboards) live outside the [locale] URL
 * structure so their links stay stable, but still honor the visitor's
 * language preference via the same NEXT_LOCALE cookie the public site's
 * locale routing sets — so a parent who browsed the site in Urdu gets an
 * Urdu portal automatically, and the in-portal switcher just updates it.
 */
export async function getPortalLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(COOKIE_NAME)?.value;
  return hasLocale(routing.locales, value) ? value : routing.defaultLocale;
}
