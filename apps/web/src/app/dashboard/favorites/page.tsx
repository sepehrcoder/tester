"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { PropertyCard, type Property } from "@/components/marketing/PropertyCard";
import { useAuthedFetch } from "@/lib/useAuthedFetch";
import { formatPKR } from "@/lib/price";

interface FavoriteEntry {
  id: string;
  listing: {
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
  };
}

export default function FavoritesPage() {
  const { data, loading, error } = useAuthedFetch<FavoriteEntry[]>("/favorites");

  const listings: Property[] = (data ?? []).map((f) => ({
    id: f.listing.id,
    price: formatPKR(f.listing.price),
    title: f.listing.title,
    location: `${f.listing.area}, ${f.listing.city}`,
    verified: f.listing.verified,
    promoTier: f.listing.promoTier,
    tag: f.listing.beds ? `${f.listing.beds} bed` : f.listing.source === "OWNER" ? "Owner listed" : "Listing",
    photoUrl: f.listing.photos[0]?.url,
  }));

  return (
    <div>
      <PageHeader title="Saved listings" subtitle="Properties you've saved for later." />

      {loading && <p className="font-body text-sm text-ink-soft">Loading…</p>}
      {error && <p className="font-body text-sm text-ember">{error}</p>}
      {data && listings.length === 0 && (
        <p className="font-body text-sm text-ink-faint">
          Nothing saved yet — tap the heart on any listing to save it here.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((l) => (
          <PropertyCard key={l.id} {...l} />
        ))}
      </div>
    </div>
  );
}
