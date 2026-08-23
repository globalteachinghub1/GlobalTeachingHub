import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { FreeTrialForm } from "@/components/sections/free-trial-form";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    title: "Book a Free Demo — Global Teaching Hub",
    description: "Book a free demo class with Global Teaching Hub.",
    path: "/free-trial",
    locale: locale as Locale,
  });
}

// Courses are admin-managed and must always reflect live data, not a
// snapshot frozen at build time.
export const dynamic = "force-dynamic";

export default async function FreeTrialPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("FreeTrialPage");
  const rawCourses = await prisma.course.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      translations: { where: { locale }, select: { name: true } },
    },
  });
  const courses = rawCourses.map((c) => ({
    id: c.id,
    name: c.translations[0]?.name ?? c.name,
  }));

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
              {t("title")}
            </h1>
            <p className="mt-3 text-muted-foreground">{t("subtitle")}</p>
          </div>

          <div className="mt-12">
            <FreeTrialForm courses={courses} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
