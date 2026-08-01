"use client";

import { PageHeader } from "@/components/admin/PageHeader";
import { Table } from "@/components/admin/Table";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useAdminFetch } from "@/lib/useAdminFetch";

interface AdminLead {
  id: string;
  status: string;
  slaDeadline: string | null;
  createdAt: string;
  requirement: { city: string; propertyType: string; purpose: string };
  dealer: { name: string } | null;
}

export default function AdminLeadsPage() {
  const { data, loading, error } = useAdminFetch<AdminLead[]>("/admin/leads");

  return (
    <div>
      <PageHeader title="Leads" subtitle="Every requirement lead across the platform — broadcast, claimed, or closed." />
      {loading && <p className="font-body text-sm text-ink-soft">Loading…</p>}
      {error && <p className="font-body text-sm text-ember">{error}</p>}
      {data && (
        <Table
          rows={data}
          keyFor={(l) => l.id}
          emptyMessage="No leads yet."
          columns={[
            {
              header: "Requirement",
              cell: (l) => (
                <span>
                  {l.requirement.propertyType} · {l.requirement.purpose} · {l.requirement.city}
                </span>
              ),
            },
            { header: "Status", cell: (l) => <StatusBadge status={l.status} /> },
            { header: "Dealer", cell: (l) => l.dealer?.name ?? "— unclaimed —" },
            {
              header: "SLA deadline",
              cell: (l) => (l.slaDeadline ? new Date(l.slaDeadline).toLocaleString() : "—"),
            },
            { header: "Created", cell: (l) => new Date(l.createdAt).toLocaleDateString() },
          ]}
        />
      )}
    </div>
  );
}
