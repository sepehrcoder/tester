"use client";

import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { Table } from "@/components/shared/Table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAuthedFetch } from "@/lib/useAuthedFetch";

interface AdminLead {
  id: string;
  status: string;
  slaDeadline: string | null;
  createdAt: string;
  requirement: { city: string; propertyType: string; purpose: string };
  dealer: { name: string } | null;
}

export default function AdminLeadsPage() {
  const { data, loading, error } = useAuthedFetch<AdminLead[]>("/admin/leads");

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
                <Link href={`/admin/leads/${l.id}`} className="hover:underline">
                  {l.requirement.propertyType} · {l.requirement.purpose} · {l.requirement.city}
                </Link>
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
