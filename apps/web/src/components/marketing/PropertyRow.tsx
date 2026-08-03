"use client";

import { useState } from "react";
import Link from "next/link";
import { IconChat, IconMapPin, IconPhone } from "@repo/icons/web";
import { Badge } from "@/components/ui/Badge";
import type { Property } from "./PropertyCard";

// The dense one-listing-per-row search-results layout, corrected against
// the confirmed Zameen/Realtor pattern (platform blueprint §03/12) — the
// default archive view, with the photo grid kept as a secondary toggle.
export function PropertyRow({ id, price, title, location, verified, promoTier, tag, photoUrl, phone }: Property) {
  const [imageFailed, setImageFailed] = useState(false);

  const row = (
    <article className="surface-flat flex gap-4 p-4">
      <div className="h-24 w-32 flex-shrink-0 overflow-hidden rounded-sm bg-linear-to-br from-violet to-cyan sm:h-28 sm:w-40">
        {photoUrl && !imageFailed && (
          // eslint-disable-next-line @next/next/no-img-element -- external hotlinked stock photo
          <img src={photoUrl} alt="" className="h-full w-full object-cover" onError={() => setImageFailed(true)} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {promoTier && promoTier !== "STANDARD" && <Badge variant="ember">{promoTier === "PREMIUM" ? "Premium" : "Featured"}</Badge>}
          {verified && <Badge variant="teal">Verified</Badge>}
        </div>
        <p className="tabular mt-1 font-display text-lg font-extrabold text-ink">{price}</p>
        <h3 className="truncate font-body text-sm font-semibold text-ink">{title}</h3>
        <p className="mt-0.5 flex items-center gap-1 truncate font-body text-xs text-ink-soft">
          <IconMapPin size={13} className="flex-shrink-0" />
          {location}
        </p>
        <div className="mt-1.5">
          <Badge variant="ghost">{tag}</Badge>
        </div>

        {phone && (
          <div className="mt-3 flex gap-2">
            <a
              href={`https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi, I'm interested in "${title}" on Manzil.`)}`}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 rounded-sm bg-[#25D366] px-3 py-1.5 font-body text-xs font-bold text-white"
            >
              WhatsApp
            </a>
            <a
              href={`tel:${phone}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 rounded-sm bg-flat px-3 py-1.5 font-body text-xs font-bold text-ink-soft"
            >
              <IconPhone size={13} />
              Call
            </a>
            <span className="flex items-center gap-1.5 rounded-sm bg-flat px-3 py-1.5 font-body text-xs font-bold text-ink-soft">
              <IconChat size={13} />
              Message
            </span>
          </div>
        )}
      </div>
    </article>
  );

  return id ? (
    <Link href={`/listings/${id}`} className="block transition-transform hover:scale-[1.005]">
      {row}
    </Link>
  ) : (
    row
  );
}
