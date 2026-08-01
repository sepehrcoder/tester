"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Table } from "@/components/shared/Table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { useAuthedFetch } from "@/lib/useAuthedFetch";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

interface Listing {
  id: string;
  title: string;
  city: string;
  area: string;
  price: string;
  status: string;
  verified: boolean;
  owner: { name: string; role: string };
}

const FILTERS = ["ALL", "PENDING", "APPROVED", "REJECTED", "FLAGGED"] as const;

export default function AdminListingsPage() {
  const { accessToken } = useAuth();
  const { data, loading, error, refetch } = useAuthedFetch<Listing[]>("/admin/listings");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("PENDING");
  const [busyId, setBusyId] = useState<string | null>(null);

  const rows = useMemo(() => (data ?? []).filter((l) => filter === "ALL" || l.status === filter), [data, filter]);

  async function moderate(id: string, status: "APPROVED" | "REJECTED" | "FLAGGED", verified?: boolean) {
    setBusyId(id);
    try {
      await apiFetch(`/admin/listings/${id}/moderate`, { method: "PATCH", token: accessToken, body: { status, verified } });
      refetch();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader title="Listings" subtitle="Moderate submitted properties." />

      <div className="mb-4 flex gap-2">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}>
            <Badge variant={filter === f ? "ember" : "ghost"}>{f}</Badge>
          </button>
        ))}
      </div>

      {loading && <p className="font-body text-sm text-ink-soft">Loading…</p>}
      {error && <p className="font-body text-sm text-ember">{error}</p>}
      {data && (
        <Table
          rows={rows}
          keyFor={(l) => l.id}
          emptyMessage="No listings in this filter."
          columns={[
            {
              header: "Listing",
              cell: (l) => (
                <div>
                  <p className="font-semibold">{l.title}</p>
                  <p className="text-xs text-ink-soft">
                    {l.area}, {l.city}
                  </p>
                </div>
              ),
            },
            { header: "Owner", cell: (l) => `${l.owner.name} (${l.owner.role})` },
            { header: "Price", cell: (l) => `PKR ${Number(l.price).toLocaleString()}`, className: "tabular" },
            { header: "Status", cell: (l) => <StatusBadge status={l.status} /> },
            { header: "Verified", cell: (l) => (l.verified ? <Badge variant="teal">Yes</Badge> : <Badge variant="ghost">No</Badge>) },
            {
              header: "Actions",
              cell: (l) => (
                <div className="flex gap-2">
                  <button
                    disabled={busyId === l.id}
                    onClick={() => moderate(l.id, "APPROVED", true)}
                    className="rounded-sm bg-teal-soft px-2.5 py-1 font-body text-xs font-bold text-teal disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    disabled={busyId === l.id}
                    onClick={() => moderate(l.id, "REJECTED")}
                    className="rounded-sm bg-ember px-2.5 py-1 font-body text-xs font-bold text-ember-ink disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button
                    disabled={busyId === l.id}
                    onClick={() => moderate(l.id, "FLAGGED")}
                    className="rounded-sm bg-flat px-2.5 py-1 font-body text-xs font-bold text-ink-soft disabled:opacity-50"
                  >
                    Flag
                  </button>
                </div>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
