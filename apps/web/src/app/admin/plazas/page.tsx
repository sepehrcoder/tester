"use client";

import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { Table } from "@/components/shared/Table";
import { useAuthedFetch } from "@/lib/useAuthedFetch";

interface AdminPlaza {
  id: string;
  name: string;
  city: string | null;
  manager: { name: string; phone: string };
  unitCount: number;
  occupiedCount: number;
  createdAt: string;
}

export default function AdminPlazasPage() {
  const { data, loading, error } = useAuthedFetch<AdminPlaza[]>("/admin/plazas");

  return (
    <div>
      <PageHeader title="Plazas" subtitle="Every building under management, and its occupancy." />
      {loading && <p className="font-body text-sm text-ink-soft">Loading…</p>}
      {error && <p className="font-body text-sm text-ember">{error}</p>}
      {data && (
        <Table
          rows={data}
          keyFor={(p) => p.id}
          emptyMessage="No plazas yet."
          columns={[
            {
              header: "Plaza",
              cell: (p) => (
                <Link href={`/admin/plazas/${p.id}`} className="font-semibold hover:underline">
                  {p.name}
                </Link>
              ),
            },
            { header: "City", cell: (p) => p.city ?? "—" },
            { header: "Manager", cell: (p) => `${p.manager.name} (${p.manager.phone})` },
            { header: "Units", cell: (p) => p.unitCount, className: "tabular" },
            { header: "Occupied", cell: (p) => `${p.occupiedCount} / ${p.unitCount}`, className: "tabular" },
            { header: "Created", cell: (p) => new Date(p.createdAt).toLocaleDateString() },
          ]}
        />
      )}
    </div>
  );
}
