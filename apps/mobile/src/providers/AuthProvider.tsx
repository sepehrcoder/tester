import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import * as SecureStore from "expo-secure-store";
import { apiFetch, ApiError } from "@/lib/api";

// Six roles exist on the backend now (CUSTOMER/DEALER/ADMIN plus
// COMPANY/TENANT/PLAZA_MANAGER added for property management) — this app
// only has UI for the first three, but /auth/me can still return any of
// them for an account created via the website, so the type has to allow it.
export interface CurrentUser {
  id: string;
  role: "CUSTOMER" | "DEALER" | "ADMIN" | "COMPANY" | "TENANT" | "PLAZA_MANAGER";
  name: string;
  phone: string;
  email?: string | null;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface RegisterResult {
  userId: string;
  otpExpiresAt: string;
  devCode?: string;
}

interface AuthContextValue {
  user: CurrentUser | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (dto: { phone: string; name: string; password: string; role: "CUSTOMER" | "DEALER" }) => Promise<RegisterResult>;
  verifyOtp: (phone: string, code: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const STORE_KEY = "marketplace.tokens";

async function persist(tokens: TokenPair) {
  await SecureStore.setItemAsync(STORE_KEY, JSON.stringify(tokens));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    SecureStore.getItemAsync(STORE_KEY)
      .then(async (stored) => {
        if (!stored) return;
        const tokens: TokenPair = JSON.parse(stored);
        const me = await apiFetch<CurrentUser>("/auth/me", { token: tokens.accessToken });
        setUser(me);
      })
      .catch(() => SecureStore.deleteItemAsync(STORE_KEY))
      .finally(() => setLoading(false));
  }, []);

  async function login(phone: string, password: string) {
    const tokens = await apiFetch<TokenPair>("/auth/login", { method: "POST", body: { phone, password } });
    await persist(tokens);
    setUser(await apiFetch<CurrentUser>("/auth/me", { token: tokens.accessToken }));
  }

  async function register(dto: { phone: string; name: string; password: string; role: "CUSTOMER" | "DEALER" }) {
    return apiFetch<RegisterResult>("/auth/register", { method: "POST", body: dto });
  }

  async function verifyOtp(phone: string, code: string) {
    const tokens = await apiFetch<TokenPair>("/auth/verify-otp", { method: "POST", body: { phone, code } });
    await persist(tokens);
    setUser(await apiFetch<CurrentUser>("/auth/me", { token: tokens.accessToken }));
  }

  function logout() {
    SecureStore.deleteItemAsync(STORE_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, verifyOtp, logout }}>
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
