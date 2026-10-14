import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { MobileNav } from "@/components/layout/mobile-nav";

export async function Header() {
  const t = await getTranslations("Nav");

  const NAV_LINKS = [
    { label: t("home"), href: "/" },
    { label: t("about"), href: "/about" },
    { label: t("courses"), href: "/courses" },
    { label: t("howItWorks"), href: "/#how-it-works" },
    { label: t("reviews"), href: "/#testimonials" },
    { label: t("blog"), href: "/blog" },
    { label: t("contact"), href: "/contact" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex flex-1 items-center">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <Image
              src="/icon.png"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 object-contain"
              priority
            />
            <span className="text-base text-foreground">Global Teaching Hub</span>
          </Link>
        </div>

        <nav className="hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-3">
          <LanguageSwitcher />
          <div className="hidden items-center gap-3 sm:flex">
            <Link href="/login" className={buttonVariants({ variant: "outline" })}>
              {t("login")}
            </Link>
            <Link href="/register" className={buttonVariants()}>
              {t("getStarted")}
            </Link>
          </div>

          <MobileNav
            openLabel="Open menu"
            links={NAV_LINKS}
            loginLabel={t("login")}
            getStartedLabel={t("getStarted")}
          />
        </div>
      </div>
    </header>
  );
}
