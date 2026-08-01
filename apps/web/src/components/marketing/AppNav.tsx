"use client";

import Link from "next/link";
import { IconBell, IconSearch, IconUpload } from "@repo/icons/web";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/providers/AuthProvider";

export function AppNav() {
  const { user, loading, logout } = useAuth();

  return (
    <header className="surface-glass-strong sticky top-4 z-10 mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3">
      <Link href="/" className="font-display text-lg font-extrabold tracking-tight text-ink">
        Manzil
      </Link>

      <nav className="hidden items-center gap-6 font-body text-sm font-semibold text-ink-soft md:flex">
        <a href="#" className="text-ink">
          Buy
        </a>
        <a href="#">Rent</a>
        <a href="#">Post a requirement</a>
        <a href="#">Find dealers</a>
      </nav>

      <div className="flex items-center gap-3">
        <button aria-label="Search" className="text-ink-soft hover:text-ink">
          <IconSearch size={19} />
        </button>
        <button aria-label="Notifications" className="text-ink-soft hover:text-ink">
          <IconBell size={19} />
        </button>
        <Button variant="ghost" className="hidden sm:inline-flex">
          <IconUpload size={15} />
          List a property
        </Button>

        {loading ? null : user ? (
          <>
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
