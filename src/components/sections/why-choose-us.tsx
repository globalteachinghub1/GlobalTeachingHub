import {
  Clock,
  FileText,
  Headphones,
  Monitor,
  ShieldCheck,
  Users,
  Video,
  Wallet,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function WhyChooseUs() {
  const t = await getTranslations("WhyChooseUs");

  const FEATURES = [
    { icon: Video, label: t("liveClasses") },
    { icon: ShieldCheck, label: t("certifiedTeachers") },
    { icon: Clock, label: t("flexibleTimings") },
    { icon: FileText, label: t("recordedLectures") },
    { icon: Monitor, label: t("progressReports") },
    { icon: Wallet, label: t("affordableFees") },
    { icon: Users, label: t("oneToOne") },
    { icon: Headphones, label: t("support247") },
  ];

  return (
    <section className="bg-secondary/50 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
          {t("title")}
        </h2>

        <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4 lg:grid-cols-8">
          {FEATURES.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-3 text-center"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-background text-primary shadow-sm">
                <Icon className="h-6 w-6" />
              </span>
              <p className="text-xs font-medium text-muted-foreground">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
