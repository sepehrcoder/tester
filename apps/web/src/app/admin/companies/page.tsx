"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Table } from "@/components/shared/Table";
import { useAuthedFetch } from "@/lib/useAuthedFetch";

interface AdminCompany {
  id: string;
  name: string;
  inviteCode: string;
  owner: { name: string; phone: string };
  _count: { dealers: number };
  createdAt: string;
}

export default function AdminCompaniesPage() {
  const { data, loading, error } = useAuthedFetch<AdminCompany[]>("/admin/companies");

  return (
    <div>
      <PageHeader title="Companies" subtitle="Every agency account and how many dealers have joined it." />
      {loading && <p className="font-body text-sm text-ink-soft">Loading…</p>}
      {error && <p className="font-body text-sm text-ember">{error}</p>}
      {data && (
        <Table
          rows={data}
          keyFor={(c) => c.id}
          emptyMessage="No companies yet."
          columns={[
            { header: "Company", cell: (c) => <span className="font-semibold">{c.name}</span> },
            { header: "Owner", cell: (c) => `${c.owner.name} (${c.owner.phone})` },
            { header: "Dealers joined", cell: (c) => c._count.dealers, className: "tabular" },
            { header: "Invite code", cell: (c) => <span className="font-mono text-xs">{c.inviteCode}</span> },
            { header: "Created", cell: (c) => new Date(c.createdAt).toLocaleDateString() },
          ]}
        />
      )}
    </div>
  );
}
