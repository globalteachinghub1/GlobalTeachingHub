import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE_URL, localizedPath } from "@/lib/seo";
import { routing } from "@/i18n/routing";

// Courses are admin-managed and must always reflect live data, not a
// snapshot frozen at build time.
export const dynamic = "force-dynamic";

const STATIC_ROUTES: {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/about", changeFrequency: "monthly", priority: 0.8 },
  { path: "/courses", changeFrequency: "weekly", priority: 0.9 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.5 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.6 },
  { path: "/free-trial", changeFrequency: "monthly", priority: 0.8 },
  { path: "/login", changeFrequency: "yearly", priority: 0.3 },
  { path: "/register", changeFrequency: "yearly", priority: 0.5 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
];

function languageAlternates(path: string) {
  return Object.fromEntries(
    routing.locales.map((locale) => [locale, `${SITE_URL}${localizedPath(locale, path)}`])
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const courses = await prisma.course.findMany({ select: { slug: true, createdAt: true } });

  const staticEntries = STATIC_ROUTES.flatMap((route) =>
    routing.locales.map((locale) => ({
      url: `${SITE_URL}${localizedPath(locale, route.path)}`,
      lastModified: new Date(),
      changeFrequency: route.changeFrequency,
      priority: locale === routing.defaultLocale ? route.priority : route.priority - 0.1,
      alternates: { languages: languageAlternates(route.path) },
    }))
  );

  const courseEntries = courses.flatMap((course) =>
    routing.locales.map((locale) => ({
      url: `${SITE_URL}${localizedPath(locale, `/courses/${course.slug}`)}`,
      lastModified: course.createdAt,
      changeFrequency: "monthly" as const,
      priority: locale === routing.defaultLocale ? 0.7 : 0.6,
      alternates: { languages: languageAlternates(`/courses/${course.slug}`) },
    }))
  );

  return [...staticEntries, ...courseEntries];
}
