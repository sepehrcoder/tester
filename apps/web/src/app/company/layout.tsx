"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { DashboardShell, type DashboardNavItem } from "@/components/shared/DashboardShell";
import { IconAnalytics, IconClients } from "@repo/icons/web";

const NAV: DashboardNavItem[] = [
  { href: "/company", label: "Overview", icon: IconAnalytics, exact: true },
  { href: "/company/dealers", label: "Dealers", icon: IconClients },
];

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading) return null;
  if (!user) return null; // redirecting

  if (user.role !== "COMPANY") {
    return (
      <div className="flex min-h-full items-center justify-center px-4">
        <div className="aurora-backdrop" />
        <div className="surface-glass max-w-sm p-8 text-center">
          <h1 className="font-display text-xl font-extrabold text-ink">Company accounts only</h1>
          <p className="mt-2 font-body text-sm text-ink-soft">
            Signed in as {user.name}, but this dashboard is for company/agency accounts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <DashboardShell nav={NAV} brandLabel="Company Console">
      {children}
    </DashboardShell>
  );
}
