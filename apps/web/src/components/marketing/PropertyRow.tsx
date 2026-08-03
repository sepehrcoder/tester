"use client";

import { useState } from "react";
import Link from "next/link";
import { IconChat, IconMapPin, IconPhone } from "@repo/icons/web";
import { Badge } from "@/components/ui/Badge";
import { FavoriteButton } from "./FavoriteButton";
import type { Property } from "./PropertyCard";

// The dense one-listing-per-row search-results layout, corrected against
// the confirmed Zameen/Realtor pattern (platform blueprint §03/12) — the
// default archive view, with the photo grid kept as a secondary toggle.
export function PropertyRow({ id, price, title, location, verified, promoTier, tag, photoUrl, phone }: Property) {
  const [imageFailed, setImageFailed] = useState(false);

  // "Stretched link" pattern: the row-wide Link is a sibling of the
  // interactive bits below (favorite/WhatsApp/Call), not an ancestor —
  // nesting <a>/<button> inside <a> is invalid HTML and breaks hydration.
  return (
    <article className="surface-flat relative flex gap-4 p-4 transition-transform hover:scale-[1.005]">
      {id && <Link href={`/listings/${id}`} className="absolute inset-0 z-0" aria-label={title} />}

      <div className="relative z-10 h-24 w-32 flex-shrink-0 overflow-hidden rounded-sm bg-linear-to-br from-violet to-cyan sm:h-28 sm:w-40">
        {photoUrl && !imageFailed && (
          // eslint-disable-next-line @next/next/no-img-element -- external hotlinked stock photo
          <img src={photoUrl} alt="" className="h-full w-full object-cover" onError={() => setImageFailed(true)} />
        )}
        {id && <FavoriteButton listingId={id} className="relative z-10 ml-auto mr-1 mt-1 flex h-6 w-6 items-center justify-center rounded-pill bg-canvas/80 text-ink-soft" />}
      </div>
      <div className="relative z-10 min-w-0 flex-1">
        <div className="pointer-events-none flex flex-wrap items-center gap-1.5">
          {promoTier && promoTier !== "STANDARD" && <Badge variant="ember">{promoTier === "PREMIUM" ? "Premium" : "Featured"}</Badge>}
          {verified && <Badge variant="teal">Verified</Badge>}
        </div>
        <p className="tabular pointer-events-none mt-1 font-display text-lg font-extrabold text-ink">{price}</p>
        <h3 className="pointer-events-none truncate font-body text-sm font-semibold text-ink">{title}</h3>
        <p className="pointer-events-none mt-0.5 flex items-center gap-1 truncate font-body text-xs text-ink-soft">
          <IconMapPin size={13} className="flex-shrink-0" />
          {location}
        </p>
        <div className="pointer-events-none mt-1.5">
          <Badge variant="ghost">{tag}</Badge>
        </div>

        {phone && (
          <div className="relative z-10 mt-3 flex gap-2">
            <a
              href={`https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi, I'm interested in "${title}" on Manzil.`)}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-sm bg-[#25D366] px-3 py-1.5 font-body text-xs font-bold text-white"
            >
              WhatsApp
            </a>
            <a
              href={`tel:${phone}`}
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
}
