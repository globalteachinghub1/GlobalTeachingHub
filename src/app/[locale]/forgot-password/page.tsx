import type { Metadata } from "next";
import Image from "next/image";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ForgotPasswordForm } from "@/components/sections/forgot-password-form";
import { buildMetadata } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    ...buildMetadata({
      title: "Forgot Password — Global Teaching Hub",
      description: "Reset your Global Teaching Hub account password.",
      path: "/forgot-password",
      locale: locale as Locale,
    }),
    robots: { index: false, follow: false },
  };
}

export default async function ForgotPasswordPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary/20 px-4 py-20">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2 font-bold">
          <Image
            src="/icon.png"
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 object-contain"
          />
          <span className="text-base text-foreground">Global Teaching Hub</span>
        </Link>

        <h1 className="text-center text-2xl font-bold text-foreground">Forgot your password?</h1>
        <p className="mt-1.5 text-center text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a reset link.
        </p>

        <div className="mt-8">
          <ForgotPasswordForm />
        </div>
      </div>
    </main>
  );
}
