"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSession } from "@/lib/use-session";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { PortalLanguageSwitcher } from "@/components/dashboard/portal-language-switcher";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ParentAuthGuard({ children }: { children: React.ReactNode }) {
  const t = useTranslations("Portal");
  const router = useRouter();
  const user = useSession();
  const loading = user === undefined;
  const authorized = user?.role === "PARENT";

  useEffect(() => {
    if (!loading && !authorized) router.replace("/login");
  }, [loading, authorized, router]);

  if (loading || !authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        {t("checkingAccess")}
      </div>
    );
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-secondary/20">
        <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/70">
          <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex shrink-0 items-center gap-2 font-bold">
              <Image
                src="/icon.png"
                alt=""
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
              />
              <span className="hidden text-base text-foreground sm:inline">
                Global Teaching Hub
              </span>
              <span className="hidden text-xs font-medium text-muted-foreground sm:inline">
                {t("parentPortal")}
              </span>
            </Link>

            <div className="flex shrink-0 items-center gap-3">
              <PortalLanguageSwitcher />
              <ThemeToggle />
              <Avatar size="sm" className="hidden sm:flex">
                <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                  {initials(user.name)}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">{t("logout")}</span>
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </ThemeProvider>
  );
}
