import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getPortalLocale } from "@/lib/portal-locale";
import { RTL_LOCALES } from "@/i18n/routing";
import { ParentAuthGuard } from "@/components/dashboard/parent-auth-guard";

export default async function ParentPortalLayout({ children }: { children: ReactNode }) {
  const locale = await getPortalLocale();
  const messages = (await import(`../../../messages/${locale}.json`)).default;
  const dir = RTL_LOCALES.includes(locale) ? "rtl" : "ltr";

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div dir={dir} lang={locale} className="contents">
        <ParentAuthGuard>{children}</ParentAuthGuard>
      </div>
    </NextIntlClientProvider>
  );
}
