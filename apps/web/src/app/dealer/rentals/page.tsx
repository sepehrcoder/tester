"use client";

import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { Table } from "@/components/shared/Table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/Button";
import { useAuthedFetch } from "@/lib/useAuthedFetch";

interface RentalUnit {
  id: string;
  title: string;
  city: string;
  area: string | null;
  unitLayout: string;
  furnishing: string;
  monthlyRent: string;
  occupancy: string;
  plaza: { id: string; name: string } | null;
  leases: { tenant: { name: string; phone: string } }[];
}

export default function DealerRentalsPage() {
  const { data, loading, error } = useAuthedFetch<RentalUnit[]>("/rental-units/mine");

  return (
    <div>
      <PageHeader
        title="My rentals"
        subtitle="Properties you manage yourself — tenants, leases, rent, and utility records."
        action={
          <Link href="/dealer/rentals/new">
            <Button variant="primary">List a rental property</Button>
          </Link>
        }
      />

      {loading && <p className="font-body text-sm text-ink-soft">Loading…</p>}
      {error && <p className="font-body text-sm text-ember">{error}</p>}

      {data && (
        <Table
          rows={data}
          keyFor={(u) => u.id}
          emptyMessage="You haven't added a rental property yet."
          columns={[
            {
              header: "Property",
              cell: (u) => (
                <Link href={`/dealer/rentals/${u.id}`} className="font-semibold text-ink hover:text-ember">
                  {u.title}
                  <span className="block text-xs font-normal text-ink-soft">
                    {u.area ? `${u.area}, ` : ""}
                    {u.city}
                    {u.plaza ? ` · ${u.plaza.name}` : ""}
                  </span>
                </Link>
              ),
            },
            { header: "Layout", cell: (u) => u.unitLayout.replaceAll("_", " ") },
            { header: "Furnishing", cell: (u) => u.furnishing.replaceAll("_", " ") },
            { header: "Rent", cell: (u) => `PKR ${Number(u.monthlyRent).toLocaleString()}`, className: "tabular" },
            { header: "Status", cell: (u) => <StatusBadge status={u.occupancy} /> },
            { header: "Tenant", cell: (u) => u.leases[0]?.tenant.name ?? "—" },
          ]}
        />
      )}
    </div>
  );
}
