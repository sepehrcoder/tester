"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Table } from "@/components/shared/Table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAuthedFetch } from "@/lib/useAuthedFetch";

interface Assignment {
  id: string;
  acceptedAt: string;
  releasedAt: string | null;
  outcome: string | null;
  lead: {
    id: string;
    status: string;
    slaDeadline: string | null;
    requirement: { propertyType: string; purpose: string; city: string; area?: string | null };
  };
}

export default function MyLeadsPage() {
  const { data, loading, error } = useAuthedFetch<Assignment[]>("/leads/mine");

  return (
    <div>
      <PageHeader title="My leads" subtitle="Every requirement lead you've ever claimed." />

      {loading && <p className="font-body text-sm text-ink-soft">Loading…</p>}
      {error && <p className="font-body text-sm text-ember">{error}</p>}

      {data && (
        <Table
          rows={data}
          keyFor={(a) => a.id}
          emptyMessage="You haven't accepted a lead yet — check the Lead feed tab for open requirements."
          columns={[
            {
              header: "Requirement",
              cell: (a) => (
                <div>
                  <p className="font-semibold">
                    {a.lead.requirement.propertyType} · {a.lead.requirement.purpose}
                  </p>
                  <p className="text-xs text-ink-soft">
                    {a.lead.requirement.area ? `${a.lead.requirement.area}, ` : ""}
                    {a.lead.requirement.city}
                  </p>
                </div>
              ),
            },
            { header: "Lead status", cell: (a) => <StatusBadge status={a.lead.status} /> },
            { header: "Outcome", cell: (a) => (a.outcome ? <StatusBadge status={a.outcome} /> : <span className="text-ink-faint">Still open</span>) },
            { header: "Accepted", cell: (a) => new Date(a.acceptedAt).toLocaleString() },
            {
              header: "SLA deadline",
              cell: (a) => (a.lead.slaDeadline ? new Date(a.lead.slaDeadline).toLocaleString() : <span className="text-ink-faint">—</span>),
            },
          ]}
        />
      )}
    </div>
  );
}
