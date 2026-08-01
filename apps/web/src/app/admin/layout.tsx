"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { AdminShell } from "@/components/admin/AdminShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading) return null;

  if (!user) return null; // redirecting

  if (user.role !== "ADMIN") {
    return (
      <div className="flex min-h-full items-center justify-center px-4">
        <div className="aurora-backdrop" />
        <div className="surface-glass max-w-sm p-8 text-center">
          <h1 className="font-display text-xl font-extrabold text-ink">Admins only</h1>
          <p className="mt-2 font-body text-sm text-ink-soft">
            Signed in as {user.name}, but this account doesn&apos;t have admin access.
          </p>
        </div>
      </div>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}
