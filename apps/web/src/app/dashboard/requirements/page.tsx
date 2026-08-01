"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Table } from "@/components/shared/Table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAuthedFetch } from "@/lib/useAuthedFetch";

interface Requirement {
  id: string;
  propertyType: string;
  purpose: string;
  city: string;
  area?: string | null;
  budgetMin?: string | null;
  budgetMax?: string | null;
  status: string;
  createdAt: string;
  leads: { status: string }[];
}

function budgetLabel(min?: string | null, max?: string | null) {
  if (!min && !max) return "Any budget";
  const fmt = (n: string) => `PKR ${Number(n).toLocaleString()}`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  return min ? `From ${fmt(min)}` : `Up to ${fmt(max!)}`;
}

export default function MyRequirementsPage() {
  const { data, loading, error } = useAuthedFetch<Requirement[]>("/requirements/mine");

  return (
    <div>
      <PageHeader title="My requirements" subtitle="What you're looking for, and how dealers are responding." />

      {loading && <p className="font-body text-sm text-ink-soft">Loading…</p>}
      {error && <p className="font-body text-sm text-ember">{error}</p>}

      {data && (
        <Table
          rows={data}
          keyFor={(r) => r.id}
          emptyMessage="You haven't posted a requirement yet."
          columns={[
            {
              header: "Looking for",
              cell: (r) => (
                <div>
                  <p className="font-semibold">
                    {r.propertyType} · {r.purpose}
                  </p>
                  <p className="text-xs text-ink-soft">
                    {r.area ? `${r.area}, ` : ""}
                    {r.city}
                  </p>
                </div>
              ),
            },
            { header: "Budget", cell: (r) => budgetLabel(r.budgetMin, r.budgetMax), className: "tabular" },
            { header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
            {
              header: "Lead status",
              cell: (r) => (r.leads[0] ? <StatusBadge status={r.leads[0].status} /> : <span className="text-ink-faint">—</span>),
            },
            { header: "Posted", cell: (r) => new Date(r.createdAt).toLocaleDateString() },
          ]}
        />
      )}
    </div>
  );
}
