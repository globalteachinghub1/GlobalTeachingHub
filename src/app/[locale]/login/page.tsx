import type { Metadata } from "next";
import Image from "next/image";
import { Clock, TrendingUp, Video } from "lucide-react";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LoginForm } from "@/components/sections/login-form";
import { buildMetadata } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    title: "Login — Global Teaching Hub",
    description: "Login to your Global Teaching Hub student account.",
    path: "/login",
    locale: locale as Locale,
  });
}

const FEATURE_ICONS = [Video, Clock, TrendingUp];

type Feature = { title: string; description: string };

export default async function LoginPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("LoginPage");
  const features = t.raw("features") as Feature[];

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Marketing panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-linear-to-br from-teal-700 via-teal-600 to-emerald-700 p-10 text-white lg:flex">
        <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl" />

        <Link href="/" className="relative flex items-center gap-2 font-bold">
          <Image
            src="/icon.png"
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 object-contain"
          />
          <span className="text-base">Global Teaching Hub</span>
        </Link>

        <div className="relative">
          <h1 className="text-4xl leading-tight font-extrabold">
            {t("taglineLine1")}{" "}
            <span className="text-emerald-200">{t("taglineHighlight")}</span>
          </h1>
          <p className="mt-4 max-w-sm text-teal-50/90">{t("panelSubtitle")}</p>

          <div className="mt-10 flex flex-col gap-5">
            {features.map(({ title, description }, i) => {
              const Icon = FEATURE_ICONS[i];
              return (
                <div key={title} className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="text-sm text-teal-50/80">{description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="relative text-xs text-teal-50/60">
          © {new Date().getFullYear()} Global Teaching Hub. {t("rightsReserved")}
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-background px-4 py-16 sm:px-6 lg:px-8">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="mb-8 flex items-center justify-center gap-2 font-bold lg:hidden"
          >
            <Image
              src="/icon.png"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 object-contain"
            />
            <span className="text-base text-foreground">
              Global Teaching Hub
            </span>
          </Link>

          <h2 className="text-2xl font-bold text-foreground">{t("welcomeBack")}</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">{t("subtitle")}</p>

          <div className="mt-8">
            <LoginForm />
          </div>
        </div>
      </div>
    </main>
  );
}
