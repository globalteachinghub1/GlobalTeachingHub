"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { usePresenceHeartbeat } from "@/lib/use-presence-heartbeat";
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

export function StudentShell({
  name,
  onLogout,
  children,
}: {
  name: string;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  const t = useTranslations("Portal");
  const tNav = useTranslations("StudentNav");
  const pathname = usePathname();
  usePresenceHeartbeat();

  const NAV_ITEMS = [
    { label: tNav("overview"), href: "/dashboard" },
    { label: tNav("myCourses"), href: "/dashboard/courses" },
    { label: tNav("profile"), href: "/dashboard/profile" },
    { label: tNav("invoices"), href: "/dashboard/invoices" },
  ];

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
            </Link>

            <nav className="flex items-center gap-1 rounded-full bg-secondary/60 p-1">
              {NAV_ITEMS.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex shrink-0 items-center gap-3">
              <PortalLanguageSwitcher />
              <ThemeToggle />
              <Avatar size="sm" className="hidden sm:flex">
                <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                  {initials(name)}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={onLogout}
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
