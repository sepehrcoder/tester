import type { MetadataRoute } from "next";
import { API_URL } from "@/lib/api";

// §14 of the platform blueprint — regenerates on every request (Next.js
// doesn't statically cache route handlers like this by default), so it
// stays current as listings/articles publish and unpublish, rather than
// needing a manual rebuild.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://manzil.app";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/listings`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/dealers`, changeFrequency: "daily", priority: 0.6 },
    { url: `${base}/news`, changeFrequency: "daily", priority: 0.6 },
    { url: `${base}/tools`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.2 },
    { url: `${base}/contact`, changeFrequency: "monthly", priority: 0.2 },
  ];

  const [listings, articles] = await Promise.all([
    fetch(`${API_URL}/listings?pageSize=200`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .catch(() => ({ items: [] })),
    fetch(`${API_URL}/articles?pageSize=200`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .catch(() => ({ items: [] })),
  ]);

  const listingRoutes: MetadataRoute.Sitemap = (listings.items ?? []).map((l: { id: string; updatedAt?: string }) => ({
    url: `${base}/listings/${l.id}`,
    lastModified: l.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const articleRoutes: MetadataRoute.Sitemap = (articles.items ?? []).map((a: { slug: string; publishedAt?: string }) => ({
    url: `${base}/news/${a.slug}`,
    lastModified: a.publishedAt,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...listingRoutes, ...articleRoutes];
}
