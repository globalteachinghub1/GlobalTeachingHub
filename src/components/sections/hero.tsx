import { CalendarCheck, PlayCircle, Users2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

export async function Hero() {
  const t = await getTranslations("Hero");

  const STATS = [
    { icon: Users2, value: "10,000+", label: t("statStudents") },
    { icon: CalendarCheck, value: "500+", label: t("statTeachers") },
    { icon: PlayCircle, value: "20+", label: t("statCountries") },
    { icon: Users2, value: "4.9/5", label: t("statRating") },
  ];

  return (
    <section className="relative overflow-hidden bg-linear-to-b from-secondary/60 to-background">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 pt-16 pb-24 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 lg:pt-24">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            {t("titleLine1")} <span className="text-primary">{t("titleHighlight")}</span>,
            <br />
            {t("titleLine2")}
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">{t("subtitle")}</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/free-trial" className={buttonVariants({ size: "lg" })}>
              <CalendarCheck className="h-4 w-4" />
              {t("bookDemo")}
            </Link>
            <Link
              href="/courses"
              className={buttonVariants({ size: "lg", variant: "outline" })}
            >
              <PlayCircle className="h-4 w-4" />
              {t("exploreCourses")}
            </Link>
          </div>
          <div className="mt-8 flex items-center gap-3">
            <p className="text-sm text-muted-foreground">{t("socialProof")}</p>
          </div>
        </div>

        <div className="relative mx-auto flex w-full max-w-md items-center justify-center">
          <div className="absolute -inset-8 -z-10 rounded-full bg-primary/10 blur-3xl" />
          <Card className="w-full border-none bg-card shadow-xl">
            <CardContent className="flex flex-col gap-4 p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">
                  {t("liveClassInProgress")}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-medium text-red-500">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                  {t("live")}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {["Ali", "Sara", "Zain"].map((name) => (
                  <div
                    key={name}
                    className="flex flex-col items-center gap-2 rounded-xl bg-secondary/70 py-4"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                        {name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">
                      {name}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-3 rounded-xl bg-foreground/95 py-3">
                {[Users2, PlayCircle, CalendarCheck].map((Icon, i) => (
                  <span
                    key={i}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white"
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mx-auto -mt-12 max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <Card className="border-none shadow-lg">
          <CardContent className="grid grid-cols-2 gap-6 p-6 sm:grid-cols-4">
            {STATS.map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-lg font-bold text-foreground">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
