"use client";

import { useState } from "react";
import Link from "next/link";
import { IconMapPin } from "@repo/icons/web";
import { Badge } from "@/components/ui/Badge";
import { FavoriteButton } from "./FavoriteButton";

export interface Property {
  id?: string;
  price: string;
  title: string;
  location: string;
  verified?: boolean;
  promoTier?: string;
  tag: string;
  photoUrl?: string;
  phone?: string;
}

export function PropertyCard({ id, price, title, location, verified, promoTier, tag, photoUrl }: Property) {
  const [imageFailed, setImageFailed] = useState(false);

  const card = (
    <article className="surface-flat flex gap-4 p-4">
      <div className="relative h-20 w-24 flex-shrink-0 overflow-hidden rounded-sm bg-linear-to-br from-violet to-cyan">
        {photoUrl && !imageFailed && (
          // eslint-disable-next-line @next/next/no-img-element -- external hotlinked stock photo
          <img
            src={photoUrl}
            alt=""
            className="h-full w-full object-cover"
            onError={() => setImageFailed(true)}
          />
        )}
        {id && <FavoriteButton listingId={id} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-pill bg-canvas/80 text-ink-soft" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="tabular font-display text-lg font-extrabold text-ink">{price}</p>
        <h3 className="truncate font-body text-sm font-semibold text-ink">{title}</h3>
        <p className="flex items-center gap-1 truncate text-xs text-ink-soft">
          <IconMapPin size={13} className="flex-shrink-0" />
          {location}
        </p>
        <div className="mt-2 flex gap-1.5">
          {promoTier && promoTier !== "STANDARD" && <Badge variant="ember">{promoTier === "PREMIUM" ? "Premium" : "Featured"}</Badge>}
          {verified && <Badge variant="teal">Verified</Badge>}
          <Badge variant="ghost">{tag}</Badge>
        </div>
      </div>
    </article>
  );

  return id ? (
    <Link href={`/listings/${id}`} className="block transition-transform hover:scale-[1.01]">
      {card}
    </Link>
  ) : (
    card
  );
}
