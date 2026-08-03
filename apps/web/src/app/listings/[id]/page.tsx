"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { IconChat, IconClock, IconMapPin, IconReport, IconShare, IconStar, IconVerified } from "@repo/icons/web";
import { AppNav } from "@/components/marketing/AppNav";
import { PhotoGallery } from "@/components/listings/PhotoGallery";
import { PropertyCard, type Property } from "@/components/marketing/PropertyCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiError } from "@/lib/api";
import { formatPKR, formatPKRWords } from "@/lib/price";
import { sizeConversion } from "@/lib/size";
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
  promoTier: string;
  status: string;
  createdAt: string;
  phaseId: string | null;
  photos: { id: string; url: string }[];
  owner: {
    id: string;
    name: string;
    role: string;
    createdAt: string;
    phone: string;
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
  promoTier: string;
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

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter((w) => /^[\p{L}\p{N}]/u.test(w))
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "location", label: "Location & Nearby" },
  { key: "finance", label: "Home Finance" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

function monthlyInstallment(principal: number, annualRatePct: number, years: number) {
  const r = annualRatePct / 100 / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
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
  const [tab, setTab] = useState<TabKey>("overview");
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [tenureYears, setTenureYears] = useState(20);
  const [interestRate, setInterestRate] = useState(15);
  const [shareCopied, setShareCopied] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

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
      // Prefer matching within the same Phase (§03/1) when the listing has
      // one — falls back to the coarser propertyType+purpose match otherwise.
      ...(listing.phaseId ? { phaseId: listing.phaseId } : { propertyType: listing.propertyType, purpose: listing.purpose }),
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
              promoTier: l.promoTier,
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

  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const shareData = { title: listing?.title ?? "Manzil listing", url };
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // user cancelled the native share sheet — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      // clipboard unavailable — nothing more we can do
    }
  }

  async function submitReport() {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!reportReason.trim()) return;
    setReportSubmitting(true);
    setReportError(null);
    try {
      await apiFetch("/reports", {
        method: "POST",
        token: accessToken,
        body: { targetType: "LISTING", listingId: params.id, reason: reportReason.trim() },
      });
      setReportSubmitted(true);
      setReporting(false);
    } catch (err) {
      setReportError(err instanceof ApiError ? err.message : "Couldn't submit the report");
    } finally {
      setReportSubmitting(false);
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
                <div className="mb-3 flex items-center justify-between gap-2">
                  <nav className="flex min-w-0 flex-wrap items-center gap-1 font-body text-xs text-ink-faint">
                    <Link href="/" className="hover:text-ink">Home</Link>
                    <span>/</span>
                    <Link href={`/listings?city=${encodeURIComponent(listing.city)}`} className="hover:text-ink">
                      {listing.city}
                    </Link>
                    <span>/</span>
                    <span className="truncate text-ink-soft">{listing.title}</span>
                  </nav>
                  <div className="flex flex-shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={share}
                      className="flex items-center gap-1 rounded-sm px-2 py-1 font-body text-xs font-semibold text-ink-faint hover:text-ink"
                    >
                      <IconShare size={14} />
                      {shareCopied ? "Copied!" : "Share"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setReporting((v) => !v)}
                      className="flex items-center gap-1 rounded-sm px-2 py-1 font-body text-xs font-semibold text-ink-faint hover:text-ink"
                    >
                      <IconReport size={14} />
                      Report
                    </button>
                  </div>
                </div>

                {reporting && (
                  <div className="surface-flat mb-4 p-4">
                    <p className="font-body text-xs font-bold text-ink">Report this listing</p>
                    <textarea
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      placeholder="What's wrong with this listing?"
                      rows={2}
                      className="mt-2 w-full rounded-sm border border-flat-border bg-canvas px-3 py-2 font-body text-sm text-ink outline-none placeholder:text-ink-faint focus:border-ember"
                    />
                    {reportError && <p className="mt-1 font-body text-xs text-ember">{reportError}</p>}
                    <div className="mt-2 flex gap-2">
                      <Button variant="secondary" onClick={() => setReporting(false)}>
                        Cancel
                      </Button>
                      <Button variant="primary" onClick={submitReport} disabled={reportSubmitting || !reportReason.trim()}>
                        {reportSubmitting ? "Submitting…" : "Submit report"}
                      </Button>
                    </div>
                  </div>
                )}
                {reportSubmitted && (
                  <p className="mb-4 font-body text-xs text-teal">Thanks — our team will review this listing.</p>
                )}

                <PhotoGallery photos={listing.photos} title={listing.title} />

                <div className="mb-2 flex flex-wrap items-center gap-2">
                  {listing.promoTier !== "STANDARD" && (
                    <Badge variant="ember">{listing.promoTier === "PREMIUM" ? "Premium" : "Featured"}</Badge>
                  )}
                  {listing.verified && (
                    <Badge variant="teal">
                      <IconVerified size={11} className="mr-1 inline" />
                      Verified
                    </Badge>
                  )}
                  <Badge variant="ghost">{listing.propertyType}</Badge>
                  <Badge variant="ghost">{listing.purpose === "SALE" ? "For sale" : "For rent"}</Badge>
                </div>

                <p className="tabular font-display text-3xl font-extrabold text-ink">
                  {formatPKR(listing.price)}{" "}
                  <span className="font-body text-base font-semibold text-ink-faint">({formatPKRWords(listing.price)})</span>
                </p>
                <h1 className="mt-1 font-display text-xl font-bold text-ink">{listing.title}</h1>
                <p className="mt-1 flex items-center gap-1 font-body text-sm text-ink-soft">
                  <IconMapPin size={14} />
                  {listing.area}, {listing.city}
                </p>
                <p className="mt-1 font-body text-xs text-ink-faint">Ref: MZ-{listing.id.slice(-6).toUpperCase()}</p>

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
                      {listing.sizeValue != null && listing.sizeUnit ? sizeConversion(listing.sizeValue, listing.sizeUnit).primary : "—"}
                    </p>
                    <p className="font-body text-xs text-ink-faint">
                      {listing.sizeValue != null && listing.sizeUnit
                        ? sizeConversion(listing.sizeValue, listing.sizeUnit).secondary ?? "Size"
                        : "Size"}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex gap-1 border-b border-flat-border">
                  {TABS.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setTab(t.key)}
                      className={`-mb-px border-b-2 px-3 py-2 font-body text-sm font-semibold transition-colors ${
                        tab === t.key ? "border-ember text-ink" : "border-transparent text-ink-faint hover:text-ink-soft"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {tab === "overview" && (
                  <div className="mt-5">
                    <h2 className="font-display text-sm font-bold text-ink">Description</h2>
                    <p className="mt-2 whitespace-pre-line font-body text-sm text-ink-soft">{listing.description}</p>
                  </div>
                )}

                {tab === "location" && (
                  <div className="mt-5">
                    <h2 className="font-display text-sm font-bold text-ink">Location &amp; nearby</h2>
                    <p className="mt-1 font-body text-xs text-ink-faint">
                      Approximate area — exact address is shared once you message the{" "}
                      {listing.owner.role === "DEALER" ? "dealer" : "owner"}.
                    </p>
                    <div className="mt-2 overflow-hidden rounded-md border border-flat-border">
                      <iframe
                        title="Property location"
                        src={mapUrl(listing.city)}
                        className="h-64 w-full"
                        loading="lazy"
                      />
                    </div>
                  </div>
                )}

                {tab === "finance" && (
                  <div className="mt-5">
                    <h2 className="font-display text-sm font-bold text-ink">Home finance estimate</h2>
                    <p className="mt-1 font-body text-xs text-ink-faint">
                      A rough monthly installment estimate — not a loan offer. Check with your bank for actual rates.
                    </p>
                    <div className="surface-flat mt-3 space-y-4 p-4">
                      <label className="block">
                        <span className="flex justify-between font-body text-xs font-semibold text-ink-soft">
                          <span>Down payment</span>
                          <span>{downPaymentPct}%</span>
                        </span>
                        <input
                          type="range"
                          min={10}
                          max={50}
                          step={5}
                          value={downPaymentPct}
                          onChange={(e) => setDownPaymentPct(Number(e.target.value))}
                          className="mt-1 w-full"
                        />
                      </label>
                      <label className="block">
                        <span className="flex justify-between font-body text-xs font-semibold text-ink-soft">
                          <span>Loan tenure</span>
                          <span>{tenureYears} years</span>
                        </span>
                        <input
                          type="range"
                          min={5}
                          max={25}
                          step={5}
                          value={tenureYears}
                          onChange={(e) => setTenureYears(Number(e.target.value))}
                          className="mt-1 w-full"
                        />
                      </label>
                      <label className="block">
                        <span className="flex justify-between font-body text-xs font-semibold text-ink-soft">
                          <span>Interest rate</span>
                          <span>{interestRate}% / yr</span>
                        </span>
                        <input
                          type="range"
                          min={5}
                          max={25}
                          step={0.5}
                          value={interestRate}
                          onChange={(e) => setInterestRate(Number(e.target.value))}
                          className="mt-1 w-full"
                        />
                      </label>

                      {(() => {
                        const price = Number(listing.price);
                        const downPayment = price * (downPaymentPct / 100);
                        const principal = price - downPayment;
                        const monthly = monthlyInstallment(principal, interestRate, tenureYears);
                        return (
                          <div className="grid grid-cols-2 gap-4 border-t border-flat-border pt-4">
                            <div>
                              <p className="font-body text-xs text-ink-faint">Down payment</p>
                              <p className="tabular font-display text-base font-bold text-ink">{formatPKR(downPayment)}</p>
                            </div>
                            <div>
                              <p className="font-body text-xs text-ink-faint">Est. monthly installment</p>
                              <p className="tabular font-display text-base font-bold text-teal">{formatPKR(monthly)}</p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

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
                      <div className="flex gap-2">
                        <a
                          href={`https://wa.me/${listing.owner.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                            `Hi, I'm interested in "${listing.title}" on Manzil.`,
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-sm bg-[#25D366] px-5 py-3 font-body text-sm font-bold text-white transition-transform active:scale-[0.98]"
                        >
                          WhatsApp
                        </a>
                        <Button variant="primary" onClick={messageOwner} disabled={messaging} className="flex-1 justify-center">
                          <IconChat size={16} />
                          {messaging ? "…" : "Message"}
                        </Button>
                      </div>
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
