"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { useAuth } from "@/providers/AuthProvider";

export function AppNav() {
  const { user, loading, logout } = useAuth();

  return (
    <header className="surface-glass-strong sticky top-4 z-10 mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3">
      <div className="flex items-center gap-6">
        <Link href="/" className="font-display text-lg font-extrabold tracking-tight text-ink">
          Manzil
        </Link>
        <Link href="/tools" className="hidden font-body text-sm font-semibold text-ink-soft hover:text-ink sm:inline">
          Tools
        </Link>
        <Link href="/dealers" className="hidden font-body text-sm font-semibold text-ink-soft hover:text-ink sm:inline">
          Dealers
        </Link>
        <Link href="/news" className="hidden font-body text-sm font-semibold text-ink-soft hover:text-ink sm:inline">
          News
        </Link>
      </div>

      <div className="flex items-center gap-3">
        {loading ? null : user ? (
          <>
            <NotificationBell />
            {user.role === "ADMIN" && (
              <Link href="/admin">
                <Button variant="secondary">Admin console</Button>
              </Link>
            )}
            {user.role === "CUSTOMER" && (
              <Link href="/dashboard">
                <Button variant="secondary">My dashboard</Button>
              </Link>
            )}
            {user.role === "DEALER" && (
              <Link href="/dealer">
                <Button variant="secondary">Dealer console</Button>
              </Link>
            )}
            {user.role === "COMPANY" && (
              <Link href="/company">
                <Button variant="secondary">Company console</Button>
              </Link>
            )}
            {user.role === "TENANT" && (
              <Link href="/tenant">
                <Button variant="secondary">My rental</Button>
              </Link>
            )}
            {user.role === "PLAZA_MANAGER" && (
              <Link href="/plaza">
                <Button variant="secondary">Plaza console</Button>
              </Link>
            )}
            <span className="hidden font-body text-sm font-semibold text-ink sm:inline">{user.name}</span>
            <Button variant="ghost" onClick={logout}>
              Sign out
            </Button>
          </>
        ) : (
          <Link href="/login">
            <Button variant="primary">Sign in</Button>
          </Link>
        )}
      </div>
    </header>
  );
}
