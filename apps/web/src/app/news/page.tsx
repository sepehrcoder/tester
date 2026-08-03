"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AppNav } from "@/components/marketing/AppNav";
import { Badge } from "@/components/ui/Badge";
import { apiFetch, ApiError } from "@/lib/api";

const CATEGORIES = [
  { value: "", label: "All" },
  { value: "NEWS", label: "News" },
  { value: "GUIDE", label: "Guide" },
  { value: "AREA_INSIGHT", label: "Area Insight" },
];

interface ArticleSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImageUrl: string | null;
  category: string;
  publishedAt: string;
}

export default function NewsArchivePage() {
  return (
    <Suspense fallback={null}>
      <NewsArchiveContent />
    </Suspense>
  );
}

function NewsArchiveContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [q, setQ] = useState("");
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (q.trim()) params.set("q", q.trim());
    apiFetch<{ items: ArticleSummary[] }>(`/articles?${params.toString()}`)
      .then((data) => !cancelled && setArticles(data.items))
      .catch((err) => !cancelled && setError(err instanceof ApiError ? err.message : "Couldn't load articles"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [category, q]);

  function selectCategory(next: string) {
    setCategory(next);
    router.replace(next ? `/news?category=${next}` : "/news");
  }

  return (
    <>
      <div className="aurora-backdrop" />
      <div className="flex min-h-full flex-col">
        <div className="px-4 pt-4">
          <AppNav />
        </div>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
          <h1 className="mb-2 font-display text-2xl font-extrabold text-ink">News &amp; Guides</h1>
          <p className="mb-6 font-body text-sm text-ink-soft">
            Market updates, buying/renting guides, and area insights.
          </p>

          <div className="mb-6 flex flex-wrap items-center gap-3">
            {CATEGORIES.map((c) => (
              <button key={c.value} type="button" onClick={() => selectCategory(c.value)}>
                <Badge variant={category === c.value ? "teal" : "ghost"}>{c.label}</Badge>
              </button>
            ))}
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search articles"
              className="ml-auto w-56 rounded-sm border border-flat-border bg-flat px-3 py-2 font-body text-sm text-ink outline-none placeholder:text-ink-faint"
            />
          </div>

          {loading && <p className="font-body text-sm text-ink-soft">Loading…</p>}
          {error && <p className="font-body text-sm text-ember">{error}</p>}
          {!loading && !error && articles.length === 0 && (
            <p className="font-body text-sm text-ink-faint">No articles yet.</p>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <Link key={a.id} href={`/news/${a.slug}`} className="surface-flat block p-4 transition-transform hover:scale-[1.01]">
                <div className="h-32 w-full overflow-hidden rounded-sm bg-linear-to-br from-violet to-cyan">
                  {a.coverImageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element -- external hotlinked cover image
                    <img src={a.coverImageUrl} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <Badge variant="ghost">{a.category.replaceAll("_", " ")}</Badge>
                <h2 className="mt-2 font-body text-sm font-bold text-ink">{a.title}</h2>
                <p className="mt-1 line-clamp-2 font-body text-xs text-ink-soft">{a.excerpt}</p>
                <p className="mt-2 font-body text-[11px] text-ink-faint">
                  {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString() : ""}
                </p>
              </Link>
            ))}
          </div>
        </main>
      </div>
    </>
  );
}
