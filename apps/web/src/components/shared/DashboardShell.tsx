"use client";

import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconLogout } from "@repo/icons/web";
import { useAuth } from "@/providers/AuthProvider";
import { NotificationBell } from "@/components/shared/NotificationBell";

export interface DashboardNavItem {
  href: string;
  label: string;
  icon: ComponentType<{ size?: number }>;
  exact?: boolean;
}

export function DashboardShell({
  children,
  nav,
  brandLabel,
}: {
  children: ReactNode;
  nav: DashboardNavItem[];
  brandLabel: string;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-full">
      <div className="aurora-backdrop" />
      <aside className="surface-glass-strong sticky top-0 flex h-screen w-60 flex-shrink-0 flex-col gap-1 rounded-none border-r border-glass-border p-4">
        <div className="mb-6 px-2">
          <p className="font-display text-lg font-extrabold text-ink">Manzil</p>
          <p className="font-body text-xs font-bold uppercase tracking-wide text-ember">{brandLabel}</p>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {nav.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-sm px-3 py-2.5 font-body text-sm font-semibold transition-colors ${
                  active ? "bg-ember text-ember-ink" : "text-ink-soft hover:bg-flat hover:text-ink"
                }`}
              >
                <Icon size={17} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-flat-border pt-3">
          <Link href="/" className="mb-1 block truncate px-2 font-body text-xs text-ink-faint hover:text-ink-soft">
            ← Back to site
          </Link>
          <p className="truncate px-2 font-body text-xs text-ink-soft">{user?.name}</p>
          <button
            onClick={logout}
            className="mt-1 flex w-full items-center gap-3 rounded-sm px-3 py-2.5 font-body text-sm font-semibold text-ink-soft hover:bg-flat hover:text-ink"
          >
            <IconLogout size={17} />
            Sign out
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-8">
        <div className="mb-4 flex justify-end">
          <NotificationBell />
        </div>
        {children}
      </main>
    </div>
  );
}
