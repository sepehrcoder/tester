"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { DashboardShell, type DashboardNavItem } from "@/components/shared/DashboardShell";
import { IconAnalytics, IconBuilding } from "@repo/icons/web";

const NAV: DashboardNavItem[] = [
  { href: "/plaza", label: "My plazas", icon: IconAnalytics, exact: true },
  { href: "/plaza/units", label: "All units", icon: IconBuilding },
];

export default function PlazaLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading) return null;
  if (!user) return null; // redirecting

  if (user.role !== "PLAZA_MANAGER") {
    return (
      <div className="flex min-h-full items-center justify-center px-4">
        <div className="aurora-backdrop" />
        <div className="surface-glass max-w-sm p-8 text-center">
          <h1 className="font-display text-xl font-extrabold text-ink">Plaza managers only</h1>
          <p className="mt-2 font-body text-sm text-ink-soft">
            Signed in as {user.name}, but this console is for plaza manager accounts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <DashboardShell nav={NAV} brandLabel="Plaza Console">
      {children}
    </DashboardShell>
  );
}
