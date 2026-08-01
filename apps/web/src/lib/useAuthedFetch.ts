"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

export function useAuthedFetch<T>(path: string) {
  const { accessToken } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    apiFetch<T>(path, { token: accessToken })
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Something went wrong"))
      .finally(() => setLoading(false));
  }, [accessToken, path]);

  useEffect(() => {
    // Standard data-fetching-on-mount pattern (see React's own docs example
    // for this exact shape) — the setState calls happen inside refetch's
    // synchronous kickoff (setLoading/setError) and async .then/.finally,
    // not derivable from render, so an effect is the right tool here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}
