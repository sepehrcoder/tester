"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { DetailSection, FactGrid } from "@/components/shared/DetailSection";
import { Table } from "@/components/shared/Table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAuthedFetch } from "@/lib/useAuthedFetch";

interface LeaseDetail {
  id: string;
  startDate: string;
  endDate: string;
  rentAmount: string;
  depositAmount: string | null;
  agreementUrl: string | null;
  status: string;
  tenant: { id: string; name: string; phone: string };
  unit: {
    id: string;
    title: string;
    city: string;
    plaza: { id: string; name: string } | null;
    owner: { id: string; name: string } | null;
  };
  rentPayments: { id: string; forMonth: string; amount: string; status: string; note: string | null }[];
  utilityBills: { id: string; type: string; billMonth: string; amount: string; status: string }[];
  maintenance: { id: string; title: string; status: string; cost: string | null; createdAt: string }[];
}

export default function AdminLeaseDetailPage() {
  const params = useParams<{ id: string }>();
  const { data, loading, error } = useAuthedFetch<LeaseDetail>(`/admin/leases/${params.id}`);

  if (loading) return <p className="font-body text-sm text-ink-soft">Loading…</p>;
  if (error) return <p className="font-body text-sm text-ember">{error}</p>;
  if (!data) return null;

  return (
    <div>
      <PageHeader
        backHref="/admin/leases"
        backLabel="All leases"
        title={data.unit.title}
        subtitle={`${data.unit.plaza ? data.unit.plaza.name : (data.unit.owner?.name ?? "Unlinked owner")} · ${data.unit.city}`}
        action={<StatusBadge status={data.status} />}
      />

      <DetailSection title="Lease terms">
        <FactGrid
          items={[
            { label: "Tenant", value: `${data.tenant.name} (${data.tenant.phone})` },
            { label: "Term", value: `${new Date(data.startDate).toLocaleDateString()} – ${new Date(data.endDate).toLocaleDateString()}` },
            { label: "Rent", value: `PKR ${Number(data.rentAmount).toLocaleString()}/mo` },
            { label: "Deposit", value: data.depositAmount ? `PKR ${Number(data.depositAmount).toLocaleString()}` : "—" },
          ]}
        />
        {data.agreementUrl && (
          <a href={data.agreementUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block font-body text-xs font-semibold text-teal">
            View signed agreement ↗
          </a>
        )}
      </DetailSection>

      <DetailSection title={`Rent payment history (${data.rentPayments.length})`}>
        <Table
          rows={data.rentPayments}
          keyFor={(p) => p.id}
          emptyMessage="No rent payments submitted yet."
          columns={[
            { header: "Month", cell: (p) => new Date(p.forMonth).toLocaleDateString(undefined, { year: "numeric", month: "long" }) },
            { header: "Amount", cell: (p) => `PKR ${Number(p.amount).toLocaleString()}` },
            { header: "Status", cell: (p) => <StatusBadge status={p.status} /> },
          ]}
        />
      </DetailSection>

      <DetailSection title={`Utility bills (${data.utilityBills.length})`}>
        <Table
          rows={data.utilityBills}
          keyFor={(b) => b.id}
          emptyMessage="No utility bills logged yet."
          columns={[
            { header: "Type", cell: (b) => b.type },
            { header: "Month", cell: (b) => new Date(b.billMonth).toLocaleDateString(undefined, { year: "numeric", month: "long" }) },
            { header: "Amount", cell: (b) => `PKR ${Number(b.amount).toLocaleString()}` },
            { header: "Status", cell: (b) => <StatusBadge status={b.status} /> },
          ]}
        />
      </DetailSection>

      <DetailSection title={`Maintenance requests (${data.maintenance.length})`}>
        <Table
          rows={data.maintenance}
          keyFor={(m) => m.id}
          emptyMessage="No maintenance requests raised yet."
          columns={[
            { header: "Title", cell: (m) => m.title },
            { header: "Status", cell: (m) => <StatusBadge status={m.status} /> },
            { header: "Cost", cell: (m) => (m.cost ? `PKR ${Number(m.cost).toLocaleString()}` : "—") },
            { header: "Raised", cell: (m) => new Date(m.createdAt).toLocaleDateString() },
          ]}
        />
      </DetailSection>
    </div>
  );
}
