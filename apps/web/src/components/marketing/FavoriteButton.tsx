"use client";

import { useRouter } from "next/navigation";
import { IconHeart } from "@repo/icons/web";
import { useAuth } from "@/providers/AuthProvider";
import { useFavorites } from "@/providers/FavoritesProvider";

export function FavoriteButton({
  listingId,
  className,
  showLabel = false,
}: {
  listingId: string;
  className?: string;
  showLabel?: boolean;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const { isFavorited, toggle } = useFavorites();
  const favorited = isFavorited(listingId);

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      router.push("/login");
      return;
    }
    toggle(listingId);
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={favorited ? "Remove from saved listings" : "Save listing"}
      aria-pressed={favorited}
      className={className ?? "flex h-8 w-8 items-center justify-center rounded-pill bg-canvas/80 text-ink-soft"}
    >
      <IconHeart size={16} className={favorited ? "fill-ember text-ember" : ""} />
      {showLabel && (favorited ? "Saved" : "Save")}
    </button>
  );
}
