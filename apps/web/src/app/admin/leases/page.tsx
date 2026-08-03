"use client";

import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { Table } from "@/components/shared/Table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { useAuthedFetch } from "@/lib/useAuthedFetch";

interface AdminLease {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  tenant: { name: string; phone: string };
  unit: {
    title: string;
    plaza: { name: string } | null;
    owner: { name: string } | null;
  };
  _count: { rentPayments: number; maintenance: number };
}

export default function AdminLeasesPage() {
  const { data, loading, error } = useAuthedFetch<AdminLease[]>("/admin/leases");

  return (
    <div>
      <PageHeader title="Leases" subtitle="Every tenancy across the platform — a read-only oversight view." />
      {loading && <p className="font-body text-sm text-ink-soft">Loading…</p>}
      {error && <p className="font-body text-sm text-ember">{error}</p>}
      {data && (
        <Table
          rows={data}
          keyFor={(l) => l.id}
          emptyMessage="No leases yet."
          columns={[
            {
              header: "Unit",
              cell: (l) => (
                <Link href={`/admin/leases/${l.id}`} className="block hover:underline">
                  <p className="font-semibold">{l.unit.title}</p>
                  <p className="text-xs text-ink-soft">{l.unit.plaza ? l.unit.plaza.name : (l.unit.owner?.name ?? "Unlinked owner")}</p>
                </Link>
              ),
            },
            { header: "Tenant", cell: (l) => `${l.tenant.name} (${l.tenant.phone})` },
            { header: "Status", cell: (l) => <StatusBadge status={l.status} /> },
            { header: "Term", cell: (l) => `${new Date(l.startDate).toLocaleDateString()} – ${new Date(l.endDate).toLocaleDateString()}` },
            {
              header: "Needs review",
              cell: (l) => (
                <div className="flex gap-2">
                  {l._count.rentPayments > 0 && <Badge variant="ember">{l._count.rentPayments} payment(s)</Badge>}
                  {l._count.maintenance > 0 && <Badge variant="ghost">{l._count.maintenance} maintenance</Badge>}
                  {l._count.rentPayments === 0 && l._count.maintenance === 0 && <span className="text-ink-faint">—</span>}
                </div>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
