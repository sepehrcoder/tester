"use client";

import { useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Table } from "@/components/admin/Table";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useAdminFetch } from "@/lib/useAdminFetch";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

interface Report {
  id: string;
  targetType: string;
  reason: string;
  status: string;
  createdAt: string;
  reporter: { name: string };
  listing: { id: string; title: string } | null;
}

export default function AdminReportsPage() {
  const { accessToken } = useAuth();
  const { data, loading, error, refetch } = useAdminFetch<Report[]>("/admin/reports");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function act(id: string, action: "resolve" | "dismiss") {
    setBusyId(id);
    try {
      await apiFetch(`/admin/reports/${id}/${action}`, { method: "PATCH", token: accessToken });
      refetch();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader title="Reports" subtitle="Listings, users, or messages reported by other users." />
      {loading && <p className="font-body text-sm text-ink-soft">Loading…</p>}
      {error && <p className="font-body text-sm text-ember">{error}</p>}
      {data && (
        <Table
          rows={data}
          keyFor={(r) => r.id}
          emptyMessage="No reports filed."
          columns={[
            { header: "Reported by", cell: (r) => r.reporter.name },
            { header: "Target", cell: (r) => (r.listing ? r.listing.title : r.targetType) },
            { header: "Reason", cell: (r) => <span className="text-ink-soft">{r.reason}</span> },
            { header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
            {
              header: "Actions",
              cell: (r) =>
                r.status === "OPEN" ? (
                  <div className="flex gap-2">
                    <button
                      disabled={busyId === r.id}
                      onClick={() => act(r.id, "resolve")}
                      className="rounded-sm bg-teal-soft px-2.5 py-1 font-body text-xs font-bold text-teal disabled:opacity-50"
                    >
                      Resolve
                    </button>
                    <button
                      disabled={busyId === r.id}
                      onClick={() => act(r.id, "dismiss")}
                      className="rounded-sm bg-flat px-2.5 py-1 font-body text-xs font-bold text-ink-soft disabled:opacity-50"
                    >
                      Dismiss
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
