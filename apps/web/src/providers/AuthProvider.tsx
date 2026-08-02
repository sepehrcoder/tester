"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiFetch, ApiError, registerAuthHandlers, TOKEN_STORAGE_KEY, type TokenPair } from "@/lib/api";

export interface CurrentUser {
  id: string;
  role: "CUSTOMER" | "DEALER" | "ADMIN" | "COMPANY" | "TENANT" | "PLAZA_MANAGER";
  name: string;
  phone: string;
  email?: string | null;
  dealerProfile?: { kycStatus: string; agencyName?: string | null } | null;
}

interface RegisterResult {
  userId: string;
  otpExpiresAt: string;
  devCode?: string;
}

interface AuthContextValue {
  user: CurrentUser | null;
  accessToken: string | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (dto: {
    phone: string;
    name: string;
    password: string;
    role: "CUSTOMER" | "DEALER" | "COMPANY" | "TENANT" | "PLAZA_MANAGER";
    companyName?: string;
    plazaName?: string;
  }) => Promise<RegisterResult>;
  verifyOtp: (phone: string, code: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!stored) return null;
  return (JSON.parse(stored) as TokenPair).accessToken;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(readStoredToken);
  const [loading, setLoading] = useState(() => readStoredToken() !== null);

  useEffect(() => {
    if (!accessToken) return;
    apiFetch<CurrentUser>("/auth/me", { token: accessToken })
      .then(setUser)
      .catch(() => {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
        setAccessToken(null);
      })
      .finally(() => setLoading(false));
    // Intentionally mount-once: this hydrates from whatever token was in
    // localStorage when the provider first rendered.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function persist(tokens: TokenPair) {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
    setAccessToken(tokens.accessToken);
  }

  // apiFetch runs outside React and can't call hooks — it refreshes the
  // access token directly against localStorage on a 401, then reports back
  // through these two handlers so the live session (not just storage) picks
  // up the new token, or gets signed out cleanly if the refresh itself fails
  // (e.g. the 30-day refresh token has also expired).
  useEffect(() => {
    registerAuthHandlers({
      onTokensRefreshed: (tokens) => setAccessToken(tokens.accessToken),
      onSessionExpired: () => {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
        setUser(null);
        setAccessToken(null);
      },
    });
  }, []);

  async function login(phone: string, password: string) {
    const tokens = await apiFetch<TokenPair>("/auth/login", { method: "POST", body: { phone, password } });
    persist(tokens);
    const me = await apiFetch<CurrentUser>("/auth/me", { token: tokens.accessToken });
    setUser(me);
  }

  async function register(dto: {
    phone: string;
    name: string;
    password: string;
    role: "CUSTOMER" | "DEALER" | "COMPANY" | "TENANT" | "PLAZA_MANAGER";
    companyName?: string;
    plazaName?: string;
  }) {
    return apiFetch<RegisterResult>("/auth/register", { method: "POST", body: dto });
  }

  async function verifyOtp(phone: string, code: string) {
    const tokens = await apiFetch<TokenPair>("/auth/verify-otp", { method: "POST", body: { phone, code } });
    persist(tokens);
    const me = await apiFetch<CurrentUser>("/auth/me", { token: tokens.accessToken });
    setUser(me);
  }

  function logout() {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    setUser(null);
    setAccessToken(null);
  }

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, register, verifyOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { ApiError };
