"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { DashboardShell, type DashboardNavItem } from "@/components/shared/DashboardShell";
import { IconAnalytics, IconBilling, IconDocument, IconAlert, IconChat } from "@repo/icons/web";

const NAV: DashboardNavItem[] = [
  { href: "/tenant", label: "My lease", icon: IconAnalytics, exact: true },
  { href: "/tenant/payments", label: "Rent payments", icon: IconBilling },
  { href: "/tenant/utility-bills", label: "Utility bills", icon: IconDocument },
  { href: "/tenant/maintenance", label: "Maintenance", icon: IconAlert },
  { href: "/tenant/chat", label: "Chat", icon: IconChat },
];

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading) return null;
  if (!user) return null; // redirecting

  if (user.role !== "TENANT") {
    return (
      <div className="flex min-h-full items-center justify-center px-4">
        <div className="aurora-backdrop" />
        <div className="surface-glass max-w-sm p-8 text-center">
          <h1 className="font-display text-xl font-extrabold text-ink">Tenants only</h1>
          <p className="mt-2 font-body text-sm text-ink-soft">
            Signed in as {user.name}, but this portal is for tenant accounts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <DashboardShell nav={NAV} brandLabel="Tenant Portal">
      {children}
    </DashboardShell>
  );
}
