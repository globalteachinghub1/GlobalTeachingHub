import type { Locale } from "@/i18n/routing";

/**
 * DeepL target-language codes for our locales. DeepL doesn't support Urdu —
 * callers should treat `null` as "leave the text as-authored".
 */
const DEEPL_TARGET_LANG: Partial<Record<Locale, string>> = {
  es: "ES",
  de: "DE",
  fr: "FR",
  ar: "AR",
};

export function isDeeplSupported(locale: Locale): boolean {
  return locale in DEEPL_TARGET_LANG;
}

function getApiBase(apiKey: string) {
  // Free-tier keys are suffixed ":fx" and live on a different host than paid keys.
  return apiKey.endsWith(":fx") ? "https://api-free.deepl.com" : "https://api.deepl.com";
}

/**
 * Translates a batch of strings into `locale` via DeepL. Returns `null` —
 * never a same-length fallback array — if DEEPL_API_KEY isn't configured,
 * the locale isn't one DeepL supports, or the API call fails. Callers must
 * treat `null` as "translation didn't happen this time" and must NOT cache
 * it as though it were a real translation — only a genuine DeepL response
 * should ever be persisted, or a transient outage (or a request made before
 * a key was configured) would permanently freeze the original text into the
 * cache as if it were the translation.
 */
export async function translateBatch(
  texts: string[],
  locale: Locale
): Promise<string[] | null> {
  const apiKey = process.env.DEEPL_API_KEY;
  const targetLang = DEEPL_TARGET_LANG[locale];
  if (!apiKey || !targetLang || texts.length === 0) return null;

  try {
    const res = await fetch(`${getApiBase(apiKey)}/v2/translate`, {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: texts, target_lang: targetLang, source_lang: "EN" }),
    });

    if (!res.ok) {
      console.error("DeepL translation request failed", res.status, await res.text());
      return null;
    }

    const data = (await res.json()) as { translations: { text: string }[] };
    if (data.translations.length !== texts.length) return null;
    return data.translations.map((t) => t.text);
  } catch (error) {
    console.error("DeepL translation request errored", error);
    return null;
  }
}
