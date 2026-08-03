import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppNav } from "@/components/marketing/AppNav";
import { Badge } from "@/components/ui/Badge";
import { API_URL } from "@/lib/api";
import { ArticleShareBar } from "@/components/news/ArticleShareBar";

interface ArticleDetail {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  coverImageUrl: string | null;
  category: string;
  tags: string[];
  publishedAt: string;
  metaTitle: string | null;
  metaDescription: string | null;
  author: { name: string };
  related: { id: string; title: string; slug: string; coverImageUrl: string | null; category: string }[];
}

async function getArticle(slug: string): Promise<ArticleDetail | null> {
  try {
    const res = await fetch(`${API_URL}/articles/${slug}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as ArticleDetail;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return {};

  const title = article.metaTitle || article.title;
  const description = article.metaDescription || article.excerpt;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images: article.coverImageUrl ? [article.coverImageUrl] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: article.coverImageUrl ? [article.coverImageUrl] : undefined,
    },
  };
}

export default async function ArticleSinglePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.excerpt,
    image: article.coverImageUrl ? [article.coverImageUrl] : undefined,
    datePublished: article.publishedAt,
    author: { "@type": "Person", name: article.author.name },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="aurora-backdrop" />
      <div className="flex min-h-full flex-col">
        <div className="px-4 pt-4">
          <AppNav />
        </div>

        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
          <nav className="mb-3 flex items-center gap-1 font-body text-xs text-ink-faint">
            <Link href="/news" className="hover:text-ink">News &amp; Guides</Link>
            <span>/</span>
            <span className="truncate text-ink-soft">{article.title}</span>
          </nav>

          {article.coverImageUrl && (
            <div className="mb-4 h-64 w-full overflow-hidden rounded-md bg-linear-to-br from-violet to-cyan">
              {/* eslint-disable-next-line @next/next/no-img-element -- external hotlinked cover image */}
              <img src={article.coverImageUrl} alt="" className="h-full w-full object-cover" />
            </div>
          )}

          <Badge variant="ghost">{article.category.replaceAll("_", " ")}</Badge>
          <h1 className="mt-2 font-display text-2xl font-extrabold text-ink">{article.title}</h1>
          <p className="mt-1 font-body text-xs text-ink-faint">
            By {article.author.name} · {new Date(article.publishedAt).toLocaleDateString()}
          </p>

          <ArticleShareBar title={article.title} />

          <p className="mt-6 whitespace-pre-line font-body text-sm leading-relaxed text-ink-soft">{article.body}</p>

          {article.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-1.5">
              {article.tags.map((t) => (
                <Badge key={t} variant="ghost">{t}</Badge>
              ))}
            </div>
          )}

          <div className="surface-flat mt-8 p-4">
            <p className="font-body text-sm font-bold text-ink">Looking for a property?</p>
            <p className="mt-1 font-body text-xs text-ink-soft">
              Browse live listings or post your requirement and let a verified dealer find it for you.
            </p>
            <div className="mt-3 flex gap-3">
              <Link href="/listings" className="font-body text-xs font-semibold text-teal">Browse listings →</Link>
              <Link href="/requirements/new" className="font-body text-xs font-semibold text-teal">Post a requirement →</Link>
              <Link href="/dealers" className="font-body text-xs font-semibold text-teal">Find a dealer →</Link>
            </div>
          </div>

          {article.related.length > 0 && (
            <>
              <h2 className="mt-8 font-display text-sm font-bold text-ink">Related articles</h2>
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {article.related.map((r) => (
                  <Link key={r.id} href={`/news/${r.slug}`} className="surface-flat block p-3 hover:scale-[1.01]">
                    <div className="h-20 w-full overflow-hidden rounded-sm bg-linear-to-br from-violet to-cyan">
                      {r.coverImageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element -- external hotlinked cover image
                        <img src={r.coverImageUrl} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <p className="mt-2 font-body text-xs font-semibold text-ink">{r.title}</p>
                  </Link>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
}
