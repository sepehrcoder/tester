"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

interface FavoritesContextValue {
  favoriteIds: Set<string>;
  isFavorited: (listingId: string) => boolean;
  toggle: (listingId: string) => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user, accessToken } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user || !accessToken) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing derived state on sign-out, not syncing external data
      setFavoriteIds(new Set());
      return;
    }
    apiFetch<string[]>("/favorites/ids", { token: accessToken })
      .then((ids) => setFavoriteIds(new Set(ids)))
      .catch(() => {});
  }, [user, accessToken]);

  const toggle = useCallback(
    async (listingId: string) => {
      if (!accessToken) return;
      const wasFavorited = favoriteIds.has(listingId);
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (wasFavorited) next.delete(listingId);
        else next.add(listingId);
        return next;
      });
      try {
        await apiFetch(`/favorites/${listingId}`, { method: wasFavorited ? "DELETE" : "POST", token: accessToken });
      } catch {
        // revert on failure
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (wasFavorited) next.add(listingId);
          else next.delete(listingId);
          return next;
        });
      }
    },
    [accessToken, favoriteIds],
  );

  const isFavorited = useCallback((listingId: string) => favoriteIds.has(listingId), [favoriteIds]);

  return (
    <FavoritesContext.Provider value={{ favoriteIds, isFavorited, toggle }}>{children}</FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}
