"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { DashboardShell, type DashboardNavItem } from "@/components/shared/DashboardShell";
import { IconAnalytics, IconDocument, IconBuilding } from "@repo/icons/web";

const NAV: DashboardNavItem[] = [
  { href: "/dashboard", label: "Overview", icon: IconAnalytics, exact: true },
  { href: "/dashboard/requirements", label: "My requirements", icon: IconDocument },
  { href: "/dashboard/listings", label: "My listings", icon: IconBuilding },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading) return null;
  if (!user) return null; // redirecting

  if (user.role !== "CUSTOMER") {
    return (
      <div className="flex min-h-full items-center justify-center px-4">
        <div className="aurora-backdrop" />
        <div className="surface-glass max-w-sm p-8 text-center">
          <h1 className="font-display text-xl font-extrabold text-ink">Buyers &amp; owners only</h1>
          <p className="mt-2 font-body text-sm text-ink-soft">
            Signed in as {user.name}, but this dashboard is for customer accounts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <DashboardShell nav={NAV} brandLabel="My Dashboard">
      {children}
    </DashboardShell>
  );
}
