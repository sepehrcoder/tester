"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { IconChat, IconClock, IconMapPin, IconStar, IconVerified } from "@repo/icons/web";
import { AppNav } from "@/components/marketing/AppNav";
import { PhotoGallery } from "@/components/listings/PhotoGallery";
import { PropertyCard, type Property } from "@/components/marketing/PropertyCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

interface ListingDetail {
  id: string;
  title: string;
  description: string;
  price: string;
  city: string;
  area: string;
  purpose: string;
  propertyType: string;
  beds: number | null;
  baths: number | null;
  sizeValue: number | null;
  sizeUnit: string | null;
  verified: boolean;
  status: string;
  createdAt: string;
  photos: { id: string; url: string }[];
  owner: {
    id: string;
    name: string;
    role: string;
    createdAt: string;
    dealerProfile: { agencyName: string | null; ratingAvg: number; ratingCount: number; kycStatus: string } | null;
  };
}

interface ApiListing {
  id: string;
  price: string;
  title: string;
  city: string;
  area: string;
  beds: number | null;
  verified: boolean;
  source: "DEALER" | "OWNER";
  photos: { url: string }[];
}

const CITY_COORDS: Record<string, [number, number]> = {
  lahore: [31.5204, 74.3587],
  karachi: [24.8607, 67.0011],
  islamabad: [33.6844, 73.0479],
  rawalpindi: [33.5651, 73.0169],
  faisalabad: [31.4504, 73.135],
};
const DEFAULT_COORDS: [number, number] = [30.3753, 69.3451]; // Pakistan, center fallback

function mapUrl(city: string) {
  const [lat, lon] = CITY_COORDS[city.trim().toLowerCase()] ?? DEFAULT_COORDS;
  const d = 0.06;
  const bbox = `${lon - d},${lat - d},${lon + d},${lat + d}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;
}

function formatPKR(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  const rounded = Math.round(n).toString();
  const last3 = rounded.slice(-3);
  const rest = rounded.slice(0, -3);
  const grouped = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," : "";
  return `PKR ${grouped}${last3}`;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter((w) => /^[\p{L}\p{N}]/u.test(w))
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, accessToken, loading: authLoading } = useAuth();

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messaging, setMessaging] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [similar, setSimilar] = useState<Property[]>([]);

  useEffect(() => {
    apiFetch<ListingDetail>(`/listings/${params.id}`, { token: accessToken })
      .then(setListing)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load this listing"))
      .finally(() => setLoading(false));
  }, [params.id, accessToken]);

  useEffect(() => {
    if (!listing) return;
    let cancelled = false;
    const params2 = new URLSearchParams({
      propertyType: listing.propertyType,
      purpose: listing.purpose,
      pageSize: "5",
    });
    apiFetch<{ items: ApiListing[] }>(`/listings?${params2.toString()}`)
      .then((data) => {
        if (cancelled) return;
        setSimilar(
          data.items
            .filter((l) => l.id !== listing.id)
            .slice(0, 4)
            .map((l) => ({
              id: l.id,
              price: formatPKR(l.price),
              title: l.title,
              location: `${l.area}, ${l.city}`,
              verified: l.verified,
              tag: l.beds ? `${l.beds} bed` : l.source === "OWNER" ? "Owner listed" : "Listing",
              photoUrl: l.photos[0]?.url,
            })),
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [listing]);

  async function messageOwner() {
    if (!user) {
      router.push("/login");
      return;
    }
    setMessaging(true);
    setMessageError(null);
    try {
      await apiFetch<{ id: string }>(`/listings/${params.id}/chat`, {
        method: "POST",
        token: accessToken,
      });
      const inboxPath = user.role === "DEALER" ? "/dealer/messages" : "/dashboard/messages";
      router.push(inboxPath);
    } catch (err) {
      setMessageError(err instanceof ApiError ? err.message : "Couldn't start a conversation");
    } finally {
      setMessaging(false);
    }
  }

  return (
    <>
      <div className="aurora-backdrop" />
      <div className="flex min-h-full flex-col">
        <div className="px-4 pt-4">
          <AppNav />
        </div>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
          {(loading || authLoading) && <p className="font-body text-sm text-ink-soft">Loading…</p>}
          {error && <p className="font-body text-sm text-ember">{error}</p>}

          {listing && (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <PhotoGallery photos={listing.photos} title={listing.title} />

                <div className="mb-2 flex flex-wrap items-center gap-2">
                  {listing.verified && (
                    <Badge variant="teal">
                      <IconVerified size={11} className="mr-1 inline" />
                      Verified
                    </Badge>
                  )}
                  <Badge variant="ghost">{listing.propertyType}</Badge>
                  <Badge variant="ghost">{listing.purpose === "SALE" ? "For sale" : "For rent"}</Badge>
                </div>

                <p className="tabular font-display text-3xl font-extrabold text-ink">{formatPKR(listing.price)}</p>
                <h1 className="mt-1 font-display text-xl font-bold text-ink">{listing.title}</h1>
                <p className="mt-1 flex items-center gap-1 font-body text-sm text-ink-soft">
                  <IconMapPin size={14} />
                  {listing.area}, {listing.city}
                </p>

                <div className="surface-flat mt-5 grid grid-cols-3 gap-4 p-4 text-center">
                  <div>
                    <p className="font-display text-lg font-bold text-ink">{listing.beds ?? "—"}</p>
                    <p className="font-body text-xs text-ink-faint">Bedrooms</p>
                  </div>
                  <div>
                    <p className="font-display text-lg font-bold text-ink">{listing.baths ?? "—"}</p>
                    <p className="font-body text-xs text-ink-faint">Bathrooms</p>
                  </div>
                  <div>
                    <p className="font-display text-lg font-bold text-ink">
                      {listing.sizeValue ?? "—"} {listing.sizeValue != null ? listing.sizeUnit : ""}
                    </p>
                    <p className="font-body text-xs text-ink-faint">Size</p>
                  </div>
                </div>

                <h2 className="mt-6 font-display text-sm font-bold text-ink">Description</h2>
                <p className="mt-2 whitespace-pre-line font-body text-sm text-ink-soft">{listing.description}</p>

                <h2 className="mt-6 font-display text-sm font-bold text-ink">Location</h2>
                <p className="mt-1 font-body text-xs text-ink-faint">
                  Approximate area — exact address is shared once you message the {listing.owner.role === "DEALER" ? "dealer" : "owner"}.
                </p>
                <div className="mt-2 overflow-hidden rounded-md border border-flat-border">
                  <iframe
                    title="Property location"
                    src={mapUrl(listing.city)}
                    className="h-64 w-full"
                    loading="lazy"
                  />
                </div>

                {similar.length > 0 && (
                  <>
                    <h2 className="mt-8 font-display text-sm font-bold text-ink">Similar listings</h2>
                    <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {similar.map((l) => (
                        <PropertyCard key={l.id} {...l} />
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="lg:col-span-1">
                <div className="surface-flat sticky top-4 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-pill bg-ember text-sm font-bold text-ember-ink">
                      {initials(listing.owner.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-body text-sm font-bold text-ink">{listing.owner.name}</p>
                      <p className="font-body text-xs text-ink-faint">
                        {listing.owner.role === "DEALER" ? listing.owner.dealerProfile?.agencyName ?? "Dealer" : "Owner"}
                      </p>
                    </div>
                  </div>

                  {listing.owner.dealerProfile && (
                    <div className="mt-3 flex items-center gap-3 font-body text-xs text-ink-soft">
                      <span className="flex items-center gap-1 font-semibold text-teal">
                        <IconStar size={13} />
                        {listing.owner.dealerProfile.ratingAvg.toFixed(1)} ({listing.owner.dealerProfile.ratingCount})
                      </span>
                      {listing.owner.dealerProfile.kycStatus === "APPROVED" && (
                        <span className="flex items-center gap-1">
                          <IconVerified size={13} className="text-teal" />
                          KYC verified
                        </span>
                      )}
                    </div>
                  )}

                  <p className="mt-3 flex items-center gap-1 font-body text-xs text-ink-faint">
                    <IconClock size={12} />
                    Member since {new Date(listing.owner.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long" })}
                  </p>

                  <div className="mt-4">
                    {user?.id === listing.owner.id ? (
                      <Link href="/dashboard/listings" className="block">
                        <Button variant="secondary" className="w-full justify-center">
                          Manage this listing
                        </Button>
                      </Link>
                    ) : (
                      <Button variant="primary" onClick={messageOwner} disabled={messaging} className="w-full justify-center">
                        <IconChat size={16} />
                        {messaging ? "Starting chat…" : "Message"}
                      </Button>
                    )}
                  </div>
                  {messageError && <p className="mt-2 font-body text-xs text-ember">{messageError}</p>}

                  <p className="mt-4 font-body text-[11px] text-ink-faint">
                    Posted {new Date(listing.createdAt).toLocaleDateString()}. Never send money before signing an
                    agreement — use in-app chat to keep a record.
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
