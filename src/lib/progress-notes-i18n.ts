import { prisma } from "@/lib/prisma";
import { routing, type Locale } from "@/i18n/routing";
import { translateBatch, isDeeplSupported } from "@/lib/deepl";

type Note = { id: string; note: string; date: Date };

/**
 * Returns each note's text translated into `locale` via DeepL, using a
 * permanent per-note cache (a note's original text never changes once
 * written, so it only ever needs translating once). Falls back to the
 * original text for the default locale, locales DeepL doesn't support
 * (Urdu), or if translation fails for any reason.
 */
export async function localizeProgressNotes<T extends Note>(notes: T[], locale: Locale) {
  if (locale === routing.defaultLocale || !isDeeplSupported(locale) || notes.length === 0) {
    return notes.map((n) => ({ ...n, note: n.note }));
  }

  const cached = await prisma.progressNoteTranslation.findMany({
    where: { noteId: { in: notes.map((n) => n.id) }, locale },
  });
  const cacheMap = new Map(cached.map((c) => [c.noteId, c.text]));

  const missing = notes.filter((n) => !cacheMap.has(n.id));
  if (missing.length > 0) {
    const translated = await translateBatch(
      missing.map((n) => n.note),
      locale
    );
    // Only persist genuine DeepL output — never cache the untranslated
    // fallback, or a missing key / transient outage would permanently
    // freeze the original English text into the cache as if translated.
    if (translated) {
      await prisma.progressNoteTranslation
        .createMany({
          data: missing.map((n, i) => ({ noteId: n.id, locale, text: translated[i] })),
          skipDuplicates: true,
        })
        .catch((error) => {
          console.error("Failed to cache progress note translation", error);
        });
      missing.forEach((n, i) => cacheMap.set(n.id, translated[i]));
    }
  }

  return notes.map((n) => ({ ...n, note: cacheMap.get(n.id) ?? n.note }));
}
