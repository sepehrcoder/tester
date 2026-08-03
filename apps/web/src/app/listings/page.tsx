"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppNav } from "@/components/marketing/AppNav";
import { PropertyCard, type Property } from "@/components/marketing/PropertyCard";
import { PropertyRow } from "@/components/marketing/PropertyRow";
import { Badge } from "@/components/ui/Badge";
import { apiFetch, ApiError } from "@/lib/api";
import { formatPKR } from "@/lib/price";

const PROPERTY_TYPES = ["HOUSE", "APARTMENT", "PLOT", "COMMERCIAL"];
const PURPOSES = ["SALE", "RENT"];

interface ApiListing {
  id: string;
  price: string;
  title: string;
  city: string;
  area: string;
  beds: number | null;
  verified: boolean;
  promoTier: string;
  source: "DEALER" | "OWNER";
  photos: { url: string }[];
  owner?: { phone: string };
}

interface AreaCount {
  area: string;
  count: number;
}

export default function ListingsSearchPage() {
  return (
    <Suspense fallback={null}>
      <ListingsSearchContent />
    </Suspense>
  );
}

function ListingsSearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [city, setCity] = useState(searchParams.get("city") ?? "");
  const [propertyType, setPropertyType] = useState(searchParams.get("propertyType") ?? "");
  const [purpose, setPurpose] = useState(searchParams.get("purpose") ?? "");
  const [verifiedOnly, setVerifiedOnly] = useState(searchParams.get("verifiedOnly") === "true");
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"list" | "grid">("list");

  const [listings, setListings] = useState<Property[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [areaCounts, setAreaCounts] = useState<AreaCount[]>([]);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (city.trim()) params.set("city", city.trim());
    if (propertyType) params.set("propertyType", propertyType);
    if (purpose) params.set("purpose", purpose);
    if (verifiedOnly) params.set("verifiedOnly", "true");
    params.set("page", String(page));
    params.set("pageSize", "12");

    apiFetch<{ items: ApiListing[]; total: number }>(`/listings?${params.toString()}`)
      .then((data) => {
        if (cancelled) return;
        setListings(
          data.items.map((item) => ({
            id: item.id,
            price: formatPKR(item.price),
            title: item.title,
            location: `${item.area}, ${item.city}`,
            verified: item.verified,
            promoTier: item.promoTier,
            tag: item.beds ? `${item.beds} bed` : item.source === "OWNER" ? "Owner listed" : "Listing",
            photoUrl: item.photos[0]?.url,
            phone: item.owner?.phone,
          })),
        );
        setTotal(data.total);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Couldn't load listings");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [city, propertyType, purpose, verifiedOnly, page]);

  useEffect(() => {
    let cancelled = false;
    if (!city.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing derived state when the city filter is cleared, not syncing external data
      setAreaCounts([]);
      return;
    }
    apiFetch<AreaCount[]>(`/listings/areas?city=${encodeURIComponent(city.trim())}`)
      .then((data) => !cancelled && setAreaCounts(data))
      .catch(() => !cancelled && setAreaCounts([]));
    return () => {
      cancelled = true;
    };
  }, [city]);

  function applyFilters(next: { city?: string; propertyType?: string; purpose?: string; verifiedOnly?: boolean }) {
    setPage(1);
    if (next.city !== undefined) setCity(next.city);
    if (next.propertyType !== undefined) setPropertyType(next.propertyType);
    if (next.purpose !== undefined) setPurpose(next.purpose);
    if (next.verifiedOnly !== undefined) setVerifiedOnly(next.verifiedOnly);

    const params = new URLSearchParams();
    const c = next.city ?? city;
    const pt = next.propertyType ?? propertyType;
    const p = next.purpose ?? purpose;
    const v = next.verifiedOnly ?? verifiedOnly;
    if (c.trim()) params.set("city", c.trim());
    if (pt) params.set("propertyType", pt);
    if (p) params.set("purpose", p);
    if (v) params.set("verifiedOnly", "true");
    router.replace(`/listings${params.toString() ? `?${params.toString()}` : ""}`);
  }

  const totalPages = Math.max(1, Math.ceil(total / 12));

  return (
    <>
      <div className="aurora-backdrop" />
      <div className="flex min-h-full flex-col">
        <div className="px-4 pt-4">
          <AppNav />
        </div>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="font-display text-2xl font-extrabold text-ink">Browse listings</h1>
            <div className="surface-glass inline-flex gap-1 rounded-sm p-1">
              <button
                type="button"
                onClick={() => setView("list")}
                className={`rounded-sm px-3 py-1 font-body text-xs font-bold ${view === "list" ? "bg-ember text-ember-ink" : "text-ink-soft"}`}
              >
                List
              </button>
              <button
                type="button"
                onClick={() => setView("grid")}
                className={`rounded-sm px-3 py-1 font-body text-xs font-bold ${view === "grid" ? "bg-ember text-ember-ink" : "text-ink-soft"}`}
              >
                Grid
              </button>
            </div>
          </div>

          <div className="surface-glass mb-6 flex flex-wrap items-center gap-3 p-4">
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilters({ city })}
              onBlur={() => applyFilters({ city })}
              placeholder="City"
              className="w-40 rounded-sm border border-flat-border bg-flat px-3 py-2 font-body text-sm text-ink outline-none placeholder:text-ink-faint"
            />
            <button onClick={() => applyFilters({ verifiedOnly: !verifiedOnly })}>
              <Badge variant={verifiedOnly ? "teal" : "ghost"}>Verified only</Badge>
            </button>
            {PURPOSES.map((p) => (
              <button key={p} onClick={() => applyFilters({ purpose: purpose === p ? "" : p })}>
                <Badge variant={purpose === p ? "teal" : "ghost"}>{p === "SALE" ? "For sale" : "For rent"}</Badge>
              </button>
            ))}
            {PROPERTY_TYPES.map((pt) => (
              <button key={pt} onClick={() => applyFilters({ propertyType: propertyType === pt ? "" : pt })}>
                <Badge variant={propertyType === pt ? "teal" : "ghost"}>{pt}</Badge>
              </button>
            ))}
          </div>

          {areaCounts.length > 0 && (
            <div className="mb-6">
              <h2 className="mb-2 font-body text-xs font-bold uppercase tracking-wide text-ink-faint">
                Locations in {city}
              </h2>
              <div className="flex flex-wrap gap-2">
                {areaCounts.map((a) => (
                  <span key={a.area} className="rounded-sm bg-flat px-2.5 py-1 font-body text-xs text-ink-soft">
                    {a.area} <span className="text-ink-faint">({a.count})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {loading && <p className="font-body text-sm text-ink-soft">Loading…</p>}
          {error && <p className="font-body text-sm text-ember">{error}</p>}
          {!loading && !error && listings.length === 0 && (
            <p className="font-body text-sm text-ink-faint">No listings match those filters.</p>
          )}

          {view === "list" ? (
            <section className="flex flex-col gap-4">
              {listings.map((l) => (
                <PropertyRow key={l.id} {...l} />
              ))}
            </section>
          ) : (
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((l) => (
                <PropertyCard key={l.id} {...l} />
              ))}
            </section>
          )}

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="font-body text-sm font-semibold text-teal disabled:opacity-40"
              >
                Prev
              </button>
              <span className="font-body text-xs text-ink-faint">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="font-body text-sm font-semibold text-teal disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
