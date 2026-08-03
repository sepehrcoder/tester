"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { IconStar, IconVerified } from "@repo/icons/web";
import { AppNav } from "@/components/marketing/AppNav";
import { PropertyCard, type Property } from "@/components/marketing/PropertyCard";
import { Badge } from "@/components/ui/Badge";
import { apiFetch, ApiError } from "@/lib/api";
import { formatPKR } from "@/lib/price";

interface DealerListing {
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
}

interface DealerReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  customer: { name: string };
}

interface DealerProfile {
  id: string;
  name: string;
  avatarUrl: string | null;
  createdAt: string;
  phone: string;
  dealerProfile: {
    agencyName: string | null;
    kycStatus: string;
    coverageCities: string[];
    propertyTypes: string[];
    ratingAvg: number;
    ratingCount: number;
  } | null;
  listings: DealerListing[];
  reviews: DealerReview[];
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter((w) => /^[\p{L}\p{N}]/u.test(w))
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

function toProperty(item: DealerListing): Property {
  return {
    id: item.id,
    price: formatPKR(item.price),
    title: item.title,
    location: `${item.area}, ${item.city}`,
    verified: item.verified,
    promoTier: item.promoTier,
    tag: item.beds ? `${item.beds} bed` : item.source === "OWNER" ? "Owner listed" : "Listing",
    photoUrl: item.photos[0]?.url,
  };
}

export default function DealerProfilePage() {
  const params = useParams<{ id: string }>();
  const [dealer, setDealer] = useState<DealerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<DealerProfile>(`/users/${params.id}/public`)
      .then(setDealer)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load this profile"))
      .finally(() => setLoading(false));
  }, [params.id]);

  return (
    <>
      <div className="aurora-backdrop" />
      <div className="flex min-h-full flex-col">
        <div className="px-4 pt-4">
          <AppNav />
        </div>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
          {loading && <p className="font-body text-sm text-ink-soft">Loading…</p>}
          {error && <p className="font-body text-sm text-ember">{error}</p>}

          {dealer && (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-pill bg-ember text-lg font-bold text-ember-ink">
                    {initials(dealer.name)}
                  </div>
                  <div className="min-w-0">
                    <h1 className="truncate font-display text-xl font-bold text-ink">{dealer.name}</h1>
                    <p className="font-body text-sm text-ink-soft">
                      {dealer.dealerProfile?.agencyName ?? "Independent dealer"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {dealer.dealerProfile && (
                    <span className="flex items-center gap-1 font-body text-sm font-semibold text-teal">
                      <IconStar size={14} />
                      {dealer.dealerProfile.ratingAvg.toFixed(1)} ({dealer.dealerProfile.ratingCount})
                    </span>
                  )}
                  {dealer.dealerProfile?.kycStatus === "APPROVED" && (
                    <Badge variant="teal">
                      <IconVerified size={11} className="mr-1 inline" />
                      KYC verified
                    </Badge>
                  )}
                  {dealer.dealerProfile?.coverageCities.map((c) => (
                    <Badge key={c} variant="ghost">
                      {c}
                    </Badge>
                  ))}
                </div>

                <h2 className="mt-8 font-display text-sm font-bold text-ink">Active listings ({dealer.listings.length})</h2>
                {dealer.listings.length === 0 ? (
                  <p className="mt-2 font-body text-sm text-ink-faint">No active listings right now.</p>
                ) : (
                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {dealer.listings.map((l) => (
                      <PropertyCard key={l.id} {...toProperty(l)} />
                    ))}
                  </div>
                )}

                <h2 className="mt-8 font-display text-sm font-bold text-ink">Reviews ({dealer.reviews.length})</h2>
                {dealer.reviews.length === 0 ? (
                  <p className="mt-2 font-body text-sm text-ink-faint">No reviews yet.</p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {dealer.reviews.map((r) => (
                      <div key={r.id} className="surface-flat p-4">
                        <div className="flex items-center justify-between">
                          <p className="font-body text-sm font-bold text-ink">{r.customer.name}</p>
                          <span className="flex items-center gap-1 font-body text-xs font-semibold text-teal">
                            <IconStar size={12} />
                            {r.rating}
                          </span>
                        </div>
                        {r.comment && <p className="mt-1 font-body text-sm text-ink-soft">{r.comment}</p>}
                        <p className="mt-1 font-body text-[11px] text-ink-faint">{new Date(r.createdAt).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="lg:col-span-1">
                <div className="surface-flat sticky top-4 p-5">
                  <p className="font-body text-xs text-ink-faint">
                    Member since {new Date(dealer.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long" })}
                  </p>
                  <a
                    href={`https://wa.me/${dealer.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi ${dealer.name}, I found your profile on Manzil.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 flex items-center justify-center gap-2 rounded-sm bg-[#25D366] px-5 py-3 font-body text-sm font-bold text-white transition-transform active:scale-[0.98]"
                  >
                    WhatsApp
                  </a>
                  <p className="mt-4 font-body text-[11px] text-ink-faint">
                    Never send money before signing an agreement — use in-app chat on a listing to keep a record.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
