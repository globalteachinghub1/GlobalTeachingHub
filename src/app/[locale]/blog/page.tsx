import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BLOG_POSTS, formatPostDate } from "@/lib/blog";
import { buildMetadata } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    title: "Blog — Global Teaching Hub",
    description:
      "Learning tips, study guides, and insights on online tutoring, Quran with Tajweed, and computer skills from Global Teaching Hub teachers.",
    path: "/blog",
    locale: locale as Locale,
  });
}

export default async function BlogPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Blog");

  const posts = [...BLOG_POSTS].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-3xl font-bold text-foreground sm:text-4xl">{t("title")}</h1>
            <p className="mt-3 text-muted-foreground">{t("subtitle")}</p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <article
                key={post.slug}
                lang="en"
                className="flex flex-col rounded-2xl border bg-card p-6 shadow-sm transition hover:shadow-md"
              >
                <time dateTime={post.date} className="text-xs text-muted-foreground">
                  {formatPostDate(post.date, locale)}
                </time>
                <h2 className="mt-2 text-lg font-semibold text-foreground">
                  <Link href={`/blog/${post.slug}`} className="hover:text-primary">
                    {post.title}
                  </Link>
                </h2>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{post.excerpt}</p>
                <Link
                  href={`/blog/${post.slug}`}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  aria-label={`${t("readMore")}: ${post.title}`}
                >
                  {t("readMore")}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
              </article>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
