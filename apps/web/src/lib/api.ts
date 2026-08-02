export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// Shared with AuthProvider so both sides read/write the exact same
// localStorage record — token refresh below writes here directly since it
// runs outside of React.
export const TOKEN_STORAGE_KEY = "marketplace.tokens";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

interface ApiFetchOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
  cache?: RequestCache;
  /** Internal: set on the retry attempt after a refresh, to prevent infinite refresh loops. */
  _isRetry?: boolean;
}

// AuthProvider registers these on mount so a refresh triggered from inside
// apiFetch (which has no React context of its own) can still update the
// live session — new tokens flow back into context state, and a refresh
// that fails logs the user out via the same path the "Sign out" button uses.
let onTokensRefreshed: ((tokens: TokenPair) => void) | null = null;
let onSessionExpired: (() => void) | null = null;

export function registerAuthHandlers(handlers: {
  onTokensRefreshed: (tokens: TokenPair) => void;
  onSessionExpired: () => void;
}) {
  onTokensRefreshed = handlers.onTokensRefreshed;
  onSessionExpired = handlers.onSessionExpired;
}

// Access tokens are short-lived (15m) by design; concurrent requests that
// all 401 around the same moment should trigger exactly one refresh call,
// not one each — this dedupes them onto a single in-flight promise.
let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const stored = window.localStorage.getItem(TOKEN_STORAGE_KEY);
        if (!stored) return null;
        const { refreshToken } = JSON.parse(stored) as TokenPair;

        const res = await fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) return null;

        const tokens = (await res.json()) as TokenPair;
        window.localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
        onTokensRefreshed?.(tokens);
        return tokens.accessToken;
      } catch {
        return null;
      }
    })();
  }
  const result = await refreshInFlight;
  refreshInFlight = null;
  return result;
}

export async function apiFetch<T>(path: string, opts: ApiFetchOptions = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: opts.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    cache: opts.cache,
  });

  // A 401 on an authenticated call almost always means the 15-minute access
  // token expired mid-session — refresh once and retry before giving up,
  // rather than surfacing a confusing error on every page after 15 minutes.
  if (res.status === 401 && opts.token && !opts._isRetry && path !== "/auth/refresh" && path !== "/auth/login") {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiFetch<T>(path, { ...opts, token: newToken, _isRetry: true });
    }
    onSessionExpired?.();
  }

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message = (data && (data.message as string)) || res.statusText;
    throw new ApiError(Array.isArray(message) ? message.join(", ") : message, res.status);
  }
  return data as T;
}
