import { ClipboardCheck, GraduationCap, UserCheck, UserPlus } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function HowItWorks() {
  const t = await getTranslations("HowItWorks");

  const STEPS = [
    {
      icon: UserPlus,
      title: t("registerTitle"),
      description: t("registerDescription"),
      color: "bg-emerald-500",
    },
    {
      icon: ClipboardCheck,
      title: t("bookDemoTitle"),
      description: t("bookDemoDescription"),
      color: "bg-blue-500",
    },
    {
      icon: UserCheck,
      title: t("chooseTeacherTitle"),
      description: t("chooseTeacherDescription"),
      color: "bg-violet-500",
    },
    {
      icon: GraduationCap,
      title: t("startLearningTitle"),
      description: t("startLearningDescription"),
      color: "bg-orange-500",
    },
  ];

  return (
    <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold text-foreground sm:text-4xl">{t("title")}</h2>
        <p className="mt-3 text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map(({ icon: Icon, title, description, color }, i) => (
          <div key={title} className="flex flex-col items-center text-center">
            <div className="relative">
              <span
                className={`flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg ${color}`}
              >
                <Icon className="h-7 w-7" />
              </span>
              <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background text-xs font-bold text-foreground shadow">
                {i + 1}
              </span>
            </div>
            <p className="mt-4 font-semibold text-foreground">{title}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
