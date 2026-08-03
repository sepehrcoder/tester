"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { DetailSection, FactGrid } from "@/components/shared/DetailSection";
import { Table } from "@/components/shared/Table";
import { Badge } from "@/components/ui/Badge";
import { useAuthedFetch } from "@/lib/useAuthedFetch";

interface PlazaDetail {
  id: string;
  name: string;
  city: string | null;
  area: string | null;
  totalFloors: number | null;
  description: string | null;
  createdAt: string;
  manager: { id: string; name: string; phone: string };
  units: {
    id: string;
    title: string;
    floorNumber: number | null;
    unitLayout: string;
    monthlyRent: string;
    occupancy: string;
    owner: { id: string; name: string } | null;
    leases: { id: string; tenant: { id: string; name: string } }[];
  }[];
}

export default function AdminPlazaDetailPage() {
  const params = useParams<{ id: string }>();
  const { data, loading, error } = useAuthedFetch<PlazaDetail>(`/admin/plazas/${params.id}`);

  if (loading) return <p className="font-body text-sm text-ink-soft">Loading…</p>;
  if (error) return <p className="font-body text-sm text-ember">{error}</p>;
  if (!data) return null;

  return (
    <div>
      <PageHeader
        backHref="/admin/plazas"
        backLabel="All plazas"
        title={data.name}
        subtitle={`Managed by ${data.manager.name} (${data.manager.phone})`}
      />

      <DetailSection title="Plaza info">
        <FactGrid
          items={[
            { label: "City", value: data.city ?? "—" },
            { label: "Area", value: data.area ?? "—" },
            { label: "Floors", value: data.totalFloors ?? "—" },
            { label: "Units", value: data.units.length },
            { label: "Created", value: new Date(data.createdAt).toLocaleDateString() },
          ]}
        />
        {data.description && <p className="mt-3 font-body text-sm text-ink-soft">{data.description}</p>}
      </DetailSection>

      <DetailSection title={`Units (${data.units.length})`}>
        <Table
          rows={data.units}
          keyFor={(u) => u.id}
          emptyMessage="No units set up in this plaza yet."
          columns={[
            { header: "Unit", cell: (u) => `${u.title}${u.floorNumber != null ? ` · Floor ${u.floorNumber}` : ""}` },
            { header: "Layout", cell: (u) => u.unitLayout.replaceAll("_", " ") },
            { header: "Rent", cell: (u) => `PKR ${Number(u.monthlyRent).toLocaleString()}/mo` },
            {
              header: "Occupancy",
              cell: (u) => <Badge variant={u.occupancy === "OCCUPIED" ? "teal" : "ghost"}>{u.occupancy}</Badge>,
            },
            { header: "Owner", cell: (u) => u.owner?.name ?? "—" },
            { header: "Tenant", cell: (u) => u.leases[0]?.tenant.name ?? "—" },
          ]}
        />
      </DetailSection>
    </div>
  );
}
