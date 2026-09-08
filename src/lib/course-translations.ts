import type { Prisma } from "@/generated/prisma/client";

/** Prisma include clause that pulls only the current-locale translation, if any. */
export function courseTranslationInclude(locale: string): Prisma.Course$translationsArgs {
  return { where: { locale } };
}

type LocalizableCourse = {
  name: string;
  summary: string;
  description: string | null;
  topics: string[];
  outcomes: string[];
  priceNote: string | null;
  translations?: {
    name: string;
    summary: string;
    description: string | null;
    topics: string[];
    outcomes: string[];
    priceNote: string | null;
  }[];
};

/** Applies the visitor's-locale translation (if one was loaded) over the base course fields. */
export function localizeCourse<T extends LocalizableCourse>(course: T) {
  const translation = course.translations?.[0];
  if (!translation) return course;
  return {
    ...course,
    name: translation.name,
    summary: translation.summary,
    description: translation.description,
    topics: translation.topics,
    outcomes: translation.outcomes,
    priceNote: translation.priceNote,
  };
}
