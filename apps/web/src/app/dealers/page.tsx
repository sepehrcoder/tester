"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppNav } from "@/components/marketing/AppNav";
import { Badge } from "@/components/ui/Badge";
import { IconStar } from "@repo/icons/web";
import { apiFetch, ApiError } from "@/lib/api";

interface Dealer {
  userId: string;
  agencyName: string | null;
  coverageCities: string[];
  propertyTypes: string[];
  ratingAvg: number;
  ratingCount: number;
  user: { name: string };
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter((w) => /^[\p{L}\p{N}]/u.test(w))
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export default function DealersDirectoryPage() {
  const [city, setCity] = useState("");
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (city.trim()) params.set("city", city.trim());
    apiFetch<Dealer[]>(`/users/dealers${params.toString() ? `?${params.toString()}` : ""}`)
      .then((data) => {
        if (!cancelled) setDealers(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Couldn't load dealers");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [city]);

  return (
    <>
      <div className="aurora-backdrop" />
      <div className="flex min-h-full flex-col">
        <div className="px-4 pt-4">
          <AppNav />
        </div>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
          <h1 className="mb-2 font-display text-2xl font-extrabold text-ink">Verified dealers</h1>
          <p className="mb-6 font-body text-sm text-ink-soft">
            Every dealer here has passed KYC review — see their coverage and rating before you reach out.
          </p>

          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Filter by city"
            className="mb-6 w-56 rounded-sm border border-flat-border bg-flat px-3 py-2 font-body text-sm text-ink outline-none placeholder:text-ink-faint"
          />

          {loading && <p className="font-body text-sm text-ink-soft">Loading…</p>}
          {error && <p className="font-body text-sm text-ember">{error}</p>}
          {!loading && !error && dealers.length === 0 && (
            <p className="font-body text-sm text-ink-faint">No verified dealers match that city yet.</p>
          )}

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dealers.map((d) => (
              <Link key={d.userId} href={`/dealers/${d.userId}`} className="block transition-transform hover:scale-[1.01]">
                <article className="surface-flat p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-pill bg-ember text-sm font-bold text-ember-ink">
                      {initials(d.user.name)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-body text-sm font-bold text-ink">{d.user.name}</h3>
                      {d.agencyName && <p className="truncate font-body text-xs text-ink-soft">{d.agencyName}</p>}
                    </div>
                  </div>
                  <p className="mt-3 font-body text-xs text-ink-faint">{d.coverageCities.join(", ") || "No coverage set"}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {d.propertyTypes.map((pt) => (
                      <Badge key={pt} variant="ghost">
                        {pt}
                      </Badge>
                    ))}
                  </div>
                  <p className="mt-3 flex items-center gap-1 font-body text-sm font-semibold text-teal">
                    <IconStar size={14} />
                    {d.ratingAvg.toFixed(1)} ({d.ratingCount})
                  </p>
                </article>
              </Link>
            ))}
          </section>
        </main>
      </div>
    </>
  );
}
