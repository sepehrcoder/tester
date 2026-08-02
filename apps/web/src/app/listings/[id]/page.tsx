"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { IconChat, IconMapPin, IconVerified } from "@repo/icons/web";
import { AppNav } from "@/components/marketing/AppNav";
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
  photos: { id: string; url: string }[];
  owner: { id: string; name: string; role: string };
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

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, accessToken, loading: authLoading } = useAuth();

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messaging, setMessaging] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<ListingDetail>(`/listings/${params.id}`, { token: accessToken })
      .then(setListing)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load this listing"))
      .finally(() => setLoading(false));
  }, [params.id, accessToken]);

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

        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
          {(loading || authLoading) && <p className="font-body text-sm text-ink-soft">Loading…</p>}
          {error && <p className="font-body text-sm text-ember">{error}</p>}

          {listing && (
            <>
              <div className="mb-4 flex h-56 w-full items-center justify-center rounded-md bg-linear-to-br from-violet to-cyan">
                {listing.photos.length === 0 && (
                  <span className="font-body text-xs text-white/70">No photos yet</span>
                )}
              </div>

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

              <div className="mt-4 flex flex-wrap gap-4 font-body text-sm text-ink-soft">
                {listing.beds != null && <span>{listing.beds} bed</span>}
                {listing.baths != null && <span>{listing.baths} bath</span>}
                {listing.sizeValue != null && (
                  <span>
                    {listing.sizeValue} {listing.sizeUnit}
                  </span>
                )}
              </div>

              <p className="mt-6 whitespace-pre-line font-body text-sm text-ink">{listing.description}</p>

              <div className="surface-flat mt-8 flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-body text-xs text-ink-faint">Listed by</p>
                  <p className="font-body text-sm font-semibold text-ink">
                    {listing.owner.name} · {listing.owner.role === "DEALER" ? "Dealer" : "Owner"}
                  </p>
                </div>
                {user?.id === listing.owner.id ? (
                  <Link href="/dashboard/listings">
                    <Button variant="secondary">Manage this listing</Button>
                  </Link>
                ) : (
                  <Button variant="primary" onClick={messageOwner} disabled={messaging}>
                    <IconChat size={16} />
                    {messaging ? "Starting chat…" : "Message"}
                  </Button>
                )}
              </div>
              {messageError && <p className="mt-2 font-body text-xs text-ember">{messageError}</p>}
            </>
          )}
        </main>
      </div>
    </>
  );
}
