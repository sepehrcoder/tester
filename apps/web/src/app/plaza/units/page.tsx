"use client";

import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { Table } from "@/components/shared/Table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAuthedFetch } from "@/lib/useAuthedFetch";

interface RentalUnit {
  id: string;
  title: string;
  floorNumber: number | null;
  unitLayout: string;
  monthlyRent: string;
  occupancy: string;
  plaza: { name: string } | null;
  owner: { name: string } | null;
  leases: { tenant: { name: string } }[];
}

export default function AllUnitsPage() {
  const { data, loading, error } = useAuthedFetch<RentalUnit[]>("/rental-units/managed");

  return (
    <div>
      <PageHeader title="All units" subtitle="Every unit across every plaza you manage." />

      {loading && <p className="font-body text-sm text-ink-soft">Loading…</p>}
      {error && <p className="font-body text-sm text-ember">{error}</p>}

      {data && (
        <Table
          rows={data}
          keyFor={(u) => u.id}
          emptyMessage="No units yet."
          columns={[
            {
              header: "Unit",
              cell: (u) => (
                <Link href={`/plaza/units/${u.id}`} className="font-semibold text-ink hover:text-ember">
                  {u.title}
                  <span className="block text-xs font-normal text-ink-soft">
                    {u.plaza?.name}
                    {u.floorNumber != null ? ` · Floor ${u.floorNumber}` : ""}
                  </span>
                </Link>
              ),
            },
            { header: "Layout", cell: (u) => u.unitLayout.replaceAll("_", " ") },
            { header: "Rent", cell: (u) => `PKR ${Number(u.monthlyRent).toLocaleString()}`, className: "tabular" },
            { header: "Status", cell: (u) => <StatusBadge status={u.occupancy} /> },
            { header: "Owner", cell: (u) => u.owner?.name ?? "Unlinked" },
            { header: "Tenant", cell: (u) => u.leases[0]?.tenant.name ?? "—" },
          ]}
        />
      )}
    </div>
  );
}
