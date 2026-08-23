import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Phone, Mail, MapPin } from "lucide-react";

export async function Footer() {
  const t = await getTranslations("Footer");
  const tNav = await getTranslations("Nav");

  const QUICK_LINKS = [
    { label: tNav("home"), href: "/" },
    { label: tNav("about"), href: "/about" },
    { label: tNav("courses"), href: "/courses" },
    { label: tNav("howItWorks"), href: "/#how-it-works" },
  ];

  const RESOURCES = [
    { label: t("faqs"), href: "/faq" },
    { label: t("privacyPolicy"), href: "/privacy" },
    { label: t("termsAndConditions"), href: "/terms" },
  ];

  const SUPPORT = [
    { label: t("contactUs"), href: "/contact" },
    { label: t("helpCenter"), href: "/faq" },
    { label: t("liveChat"), href: "/contact" },
  ];

  return (
    <footer className="bg-foreground text-background">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-16 sm:grid-cols-2 sm:px-6 lg:grid-cols-5 lg:px-8">
        <div className="sm:col-span-2 lg:col-span-2">
          <Link href="/" className="flex items-center gap-2 font-bold text-background">
            <Image
              src="/icon.png"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 object-contain"
            />
            <span>Global Teaching Hub</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm text-background/70">{t("tagline")}</p>
          <div className="mt-6 space-y-3 text-sm text-background/70">
            <div className="flex items-start gap-2">
              <Phone className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <a
                href="tel:+923195459398"
                className="transition hover:text-background hover:underline"
              >
                +92 319 5459398
              </a>
            </div>

            <div className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <a
                href="mailto:globalteachinghub1@gmail.com"
                className="break-all transition hover:text-background hover:underline"
              >
                globalteachinghub1@gmail.com
              </a>
            </div>

            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <a
                href="https://maps.google.com/?q=Lahore,Pakistan"
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-background hover:underline"
              >
                Lahore, Pakistan
              </a>
            </div>
          </div>
        </div>

        <FooterColumn title={t("quickLinks")} links={QUICK_LINKS} />
        <FooterColumn title={t("resources")} links={RESOURCES} />
        <FooterColumn title={t("support")} links={SUPPORT} />
      </div>

      <div className="border-t border-background/10 py-6 text-center text-xs text-background/60">
        © {new Date().getFullYear()} Global Teaching Hub. {t("rightsReserved")}
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-background">{title}</h4>
      <ul className="mt-4 flex flex-col gap-3 text-sm text-background/70">
        {links.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className="hover:text-background">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
