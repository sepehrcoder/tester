"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { Table } from "@/components/shared/Table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAuthedFetch } from "@/lib/useAuthedFetch";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

interface Dealer {
  id: string;
  name: string;
  phone: string;
  dealerProfile: {
    agencyName: string | null;
    kycStatus: string;
    coverageCities: string[];
    ratingAvg: number;
    ratingCount: number;
  } | null;
}

export default function AdminDealersPage() {
  const { accessToken } = useAuth();
  const { data, loading, error, refetch } = useAuthedFetch<Dealer[]>("/admin/dealers");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function moderate(id: string, status: "APPROVED" | "REJECTED") {
    setBusyId(id);
    try {
      await apiFetch(`/admin/dealers/${id}/kyc`, { method: "PATCH", token: accessToken, body: { status } });
      refetch();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader title="Dealers" subtitle="Review dealer accounts and approve or reject KYC." />
      {loading && <p className="font-body text-sm text-ink-soft">Loading…</p>}
      {error && <p className="font-body text-sm text-ember">{error}</p>}
      {data && (
        <Table
          rows={data}
          keyFor={(d) => d.id}
          emptyMessage="No dealers yet."
          columns={[
            {
              header: "Dealer",
              cell: (d) => (
                <Link href={`/admin/dealers/${d.id}`} className="block hover:underline">
                  <p className="font-semibold">{d.name}</p>
                  <p className="text-xs text-ink-soft">{d.dealerProfile?.agencyName ?? "—"}</p>
                </Link>
              ),
            },
            { header: "Phone", cell: (d) => d.phone },
            { header: "Coverage", cell: (d) => d.dealerProfile?.coverageCities.join(", ") || "—" },
            {
              header: "Rating",
              cell: (d) =>
                d.dealerProfile && d.dealerProfile.ratingCount > 0
                  ? `${d.dealerProfile.ratingAvg.toFixed(1)} (${d.dealerProfile.ratingCount})`
                  : "—",
            },
            { header: "KYC", cell: (d) => <StatusBadge status={d.dealerProfile?.kycStatus ?? "UNSUBMITTED"} /> },
            {
              header: "Actions",
              cell: (d) =>
                d.dealerProfile?.kycStatus === "PENDING" ? (
                  <div className="flex gap-2">
                    <button
                      disabled={busyId === d.id}
                      onClick={() => moderate(d.id, "APPROVED")}
                      className="rounded-sm bg-teal-soft px-2.5 py-1 font-body text-xs font-bold text-teal disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      disabled={busyId === d.id}
                      onClick={() => moderate(d.id, "REJECTED")}
                      className="rounded-sm bg-ember px-2.5 py-1 font-body text-xs font-bold text-ember-ink disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <span className="text-ink-faint">—</span>
                ),
            },
          ]}
        />
      )}
    </div>
  );
}
