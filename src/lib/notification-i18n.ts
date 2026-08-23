import { createTranslator } from "next-intl";
import { prisma } from "@/lib/prisma";
import { routing, type Locale } from "@/i18n/routing";
import { localizeCourse } from "@/lib/course-translations";
import { translateBatch, isDeeplSupported } from "@/lib/deepl";

type NotificationRow = {
  id: string;
  type: string;
  message: string;
  params: unknown;
  date: Date;
};

/**
 * Renders each notification's message from its stored type + structured
 * params, in the viewer's locale — course-related ones also resolve the
 * course's CourseTranslation for that locale. For anything that doesn't
 * match a template (rows created before this system existed, and the
 * free-form GENERAL type), falls back to machine-translating the stored
 * English `message` via DeepL, cached permanently per notification+locale
 * since that text never changes after creation.
 */
export async function localizeNotifications<T extends NotificationRow>(
  notifications: T[],
  locale: Locale
) {
  const messages = (await import(`../../messages/${locale}.json`)).default;
  const t = createTranslator({ locale, messages, namespace: "Notification" });

  const courseIds = new Set<string>();
  for (const n of notifications) {
    const p = n.params as Record<string, unknown> | null;
    if ((n.type === "WEEKLY_REPORT" || n.type === "MONTHLY_REPORT") && p?.courseId) {
      courseIds.add(String(p.courseId));
    }
  }

  const courseNameById = new Map<string, string>();
  if (courseIds.size > 0) {
    const courses = await prisma.course.findMany({
      where: { id: { in: [...courseIds] } },
      include: { translations: { where: { locale } } },
    });
    for (const c of courses) {
      courseNameById.set(c.id, localizeCourse(c).name);
    }
  }

  const rendered = notifications.map((n) => {
    const p = (n.params ?? {}) as Record<string, string | number | undefined>;
    let message = n.message;
    let templated = false;

    try {
      switch (n.type) {
        case "INVOICE_GENERATED":
          if (p.invoiceNumber && p.amount) {
            message = t("invoiceGenerated", { invoiceNumber: p.invoiceNumber, amount: p.amount });
            templated = true;
          }
          break;
        case "PAYMENT_REMINDER":
          if (p.invoiceNumber && p.amount) {
            message = t("paymentReminder", { invoiceNumber: p.invoiceNumber, amount: p.amount });
            templated = true;
          }
          break;
        case "WEEKLY_REPORT":
          if (p.courseId && p.weekStart) {
            const courseName = courseNameById.get(String(p.courseId)) ?? "";
            const date = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(
              new Date(String(p.weekStart))
            );
            message = t("weeklyReport", { courseName, date });
            templated = true;
          }
          break;
        case "MONTHLY_REPORT":
          if (p.courseId && p.month && p.year) {
            const courseName = courseNameById.get(String(p.courseId)) ?? "";
            const monthName = new Intl.DateTimeFormat(locale, { month: "long" }).format(
              new Date(Number(p.year), Number(p.month) - 1, 1)
            );
            message = t("monthlyReport", { courseName, month: monthName, year: p.year });
            templated = true;
          }
          break;
      }
    } catch (error) {
      console.error("Failed to render localized notification", error);
    }

    return { id: n.id, type: n.type, message, date: n.date, templated };
  });

  const needsTranslation = rendered.filter((n) => !n.templated);
  if (locale !== routing.defaultLocale && isDeeplSupported(locale) && needsTranslation.length > 0) {
    const cached = await prisma.notificationTranslation.findMany({
      where: { notificationId: { in: needsTranslation.map((n) => n.id) }, locale },
    });
    const cacheMap = new Map(cached.map((c) => [c.notificationId, c.text]));

    const missing = needsTranslation.filter((n) => !cacheMap.has(n.id));
    if (missing.length > 0) {
      const translated = await translateBatch(
        missing.map((n) => n.message),
        locale
      );
      // Only persist genuine DeepL output — never cache the untranslated
      // fallback, or a missing key / transient outage would permanently
      // freeze the original English text into the cache as if translated.
      if (translated) {
        await prisma.notificationTranslation
          .createMany({
            data: missing.map((n, i) => ({ notificationId: n.id, locale, text: translated[i] })),
            skipDuplicates: true,
          })
          .catch((error) => {
            console.error("Failed to cache notification translation", error);
          });
        missing.forEach((n, i) => cacheMap.set(n.id, translated[i]));
      }
    }

    for (const n of needsTranslation) {
      const translatedText = cacheMap.get(n.id);
      if (translatedText) n.message = translatedText;
    }
  }

  return rendered.map(({ id, type, message, date }) => ({ id, type, message, date }));
}
