import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { buttonVariants } from "@/components/ui/button";
import { getBlogPostBySlug, formatPostDate } from "@/lib/blog";
import { buildMetadata, OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/seo";

// BlogPosting structured data needs a CSP nonce, which only exists
// per-request (same trade-off as the FAQ page).
export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string; locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) return {};

  // Posts are written in English only. Every locale's copy of the page
  // points its canonical at the English URL (and advertises no hreflang
  // alternates) so search engines index one article, not six duplicates.
  const metadata = buildMetadata({
    title: `${post.title} — ${SITE_NAME}`,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
    locale: "en",
  });
  const canonical = `${SITE_URL}/blog/${post.slug}`;

  return {
    ...metadata,
    alternates: { canonical },
    openGraph: {
      ...metadata.openGraph,
      alternateLocale: undefined,
      type: "article",
      publishedTime: post.date,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug, locale } = await params;
  setRequestLocale(locale);
  const post = getBlogPostBySlug(slug);
  if (!post) notFound();

  const t = await getTranslations("Blog");
  const nonce = (await headers()).get("x-nonce");
  const url = `${SITE_URL}/blog/${post.slug}`;

  const postJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    inLanguage: "en",
    url,
    mainEntityOfPage: url,
    image: OG_IMAGE.url,
    author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    publisher: {
      "@type": "EducationalOrganization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo-full.png` },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        nonce={nonce ?? undefined}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(postJsonLd) }}
      />
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            {t("backToBlog")}
          </Link>

          {locale !== "en" && (
            <p className="mt-6 rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
              {t("englishOnly")}
            </p>
          )}

          <article lang="en" dir="ltr" className="mt-8">
            <time dateTime={post.date} className="text-sm text-muted-foreground">
              {formatPostDate(post.date, locale)}
            </time>
            <h1 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">{post.title}</h1>
            <div className="mt-8 space-y-5 leading-relaxed text-foreground/90">
              {post.content.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </article>

          <div className="mt-16 rounded-2xl border bg-card p-8 text-center">
            <h2 className="text-xl font-semibold text-foreground">{t("ctaTitle")}</h2>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/free-trial" className={buttonVariants({ size: "lg" })}>
                {t("ctaButton")}
              </Link>
              <Link href="/courses" className={buttonVariants({ size: "lg", variant: "outline" })}>
                {t("ctaCourses")}
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
