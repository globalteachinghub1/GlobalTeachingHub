import type { Metadata } from "next";
import { Target, Users2, Eye } from "lucide-react";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhyChooseUs } from "@/components/sections/why-choose-us";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { buildMetadata } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    title: "About Us — Global Teaching Hub",
    description: "Learn about Global Teaching Hub's mission and story.",
    path: "/about",
    locale: locale as Locale,
  });
}

export default async function AboutPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("About");
  const timeline = t.raw("timeline") as { title: string; description: string }[];

  const VALUES = [
    { icon: Target, title: t("missionTitle"), body: t("missionBody") },
    { icon: Eye, title: t("visionTitle"), body: t("visionBody") },
    { icon: Users2, title: t("teachersTitle"), body: t("teachersBody") },
  ];

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">{t("title")}</h1>
          <p className="mt-4 text-muted-foreground">{t("intro")}</p>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-3">
            {VALUES.map(({ icon: Icon, title, body }) => (
              <Card key={title} className="border-none bg-secondary/40 shadow-none">
                <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </span>
                  <p className="text-base font-semibold text-foreground">
                    {title}
                  </p>
                  <p className="text-sm text-muted-foreground">{body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
            {t("storyTitle")}
          </h2>
          <p className="mt-4 text-muted-foreground">{t("storyBody")}</p>
        </section>

        <section className="bg-secondary/30 py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
              {t("timelineTitle")}
            </h2>
            <ol className="relative mt-12 flex flex-col gap-10 border-s-2 border-primary/20 ps-8">
              {timeline.map((item, i) => (
                <li key={item.title} className="relative">
                  <span className="absolute -start-[2.55rem] flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <p className="font-semibold text-foreground">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <WhyChooseUs />

        <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">{t("ctaTitle")}</h2>
          <p className="mt-3 text-muted-foreground">{t("ctaBody")}</p>
          <Link
            href="/free-trial"
            className={buttonVariants({ size: "lg", className: "mt-6" })}
          >
            {t("ctaButton")}
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
