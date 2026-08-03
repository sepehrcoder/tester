"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { DetailSection, FactGrid } from "@/components/shared/DetailSection";
import { Table } from "@/components/shared/Table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { useAuthedFetch } from "@/lib/useAuthedFetch";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

interface UserDetail {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: string;
  createdAt: string;
  suspendedAt: string | null;
  companyOwned: { id: string; name: string } | null;
  listings: { id: string; title: string; city: string; area: string; price: string; status: string }[];
  requirements: {
    id: string;
    propertyType: string;
    purpose: string;
    city: string;
    area: string | null;
    status: string;
    leads: { id: string; status: string }[];
  }[];
  leasesAsTenant: { id: string; status: string; rentAmount: string; unit: { title: string; city: string } }[];
}

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { accessToken } = useAuth();
  const { data, loading, error, refetch } = useAuthedFetch<UserDetail>(`/admin/users/${params.id}`);
  const [busy, setBusy] = useState(false);

  async function toggleSuspend() {
    if (!data) return;
    setBusy(true);
    try {
      await apiFetch(`/admin/users/${params.id}/suspend`, {
        method: "PATCH",
        token: accessToken,
        body: { suspended: !data.suspendedAt },
      });
      refetch();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function deleteUser() {
    if (!confirm("Delete this user permanently? This can't be undone.")) return;
    setBusy(true);
    try {
      await apiFetch(`/admin/users/${params.id}`, { method: "DELETE", token: accessToken });
      router.push("/admin/users");
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Something went wrong");
      setBusy(false);
    }
  }

  if (loading) return <p className="font-body text-sm text-ink-soft">Loading…</p>;
  if (error) return <p className="font-body text-sm text-ember">{error}</p>;
  if (!data) return null;

  return (
    <div>
      <PageHeader
        backHref="/admin/users"
        backLabel="All users"
        title={data.name}
        subtitle={`${data.role} · Member since ${new Date(data.createdAt).toLocaleDateString()}`}
        action={data.suspendedAt ? <Badge variant="ember">Suspended</Badge> : <Badge variant="teal">Active</Badge>}
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <button
          disabled={busy}
          onClick={toggleSuspend}
          className="rounded-sm bg-flat px-3 py-1.5 font-body text-xs font-bold text-ink-soft disabled:opacity-50"
        >
          {data.suspendedAt ? "Reinstate" : "Suspend"}
        </button>
        <button
          disabled={busy}
          onClick={deleteUser}
          className="rounded-sm bg-ember px-3 py-1.5 font-body text-xs font-bold text-ember-ink disabled:opacity-50"
        >
          Delete
        </button>
      </div>

      <DetailSection title="Profile">
        <FactGrid
          items={[
            { label: "Phone", value: data.phone },
            { label: "Email", value: data.email ?? "—" },
            { label: "Role", value: data.role },
            { label: "Company owned", value: data.companyOwned?.name ?? "—" },
          ]}
        />
      </DetailSection>

      {data.listings.length > 0 && (
        <DetailSection title={`Listings (${data.listings.length})`}>
          <Table
            rows={data.listings}
            keyFor={(l) => l.id}
            columns={[
              { header: "Title", cell: (l) => l.title },
              { header: "Location", cell: (l) => `${l.area}, ${l.city}` },
              { header: "Price", cell: (l) => `PKR ${Number(l.price).toLocaleString()}` },
              { header: "Status", cell: (l) => <StatusBadge status={l.status} /> },
            ]}
          />
        </DetailSection>
      )}

      {data.requirements.length > 0 && (
        <DetailSection title={`Requirements (${data.requirements.length})`}>
          <Table
            rows={data.requirements}
            keyFor={(r) => r.id}
            columns={[
              { header: "Wants", cell: (r) => `${r.propertyType} · ${r.purpose} in ${r.area ? `${r.area}, ` : ""}${r.city}` },
              { header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
              { header: "Leads", cell: (r) => r.leads.length },
            ]}
          />
        </DetailSection>
      )}

      {data.leasesAsTenant.length > 0 && (
        <DetailSection title={`Leases (${data.leasesAsTenant.length})`}>
          <Table
            rows={data.leasesAsTenant}
            keyFor={(l) => l.id}
            columns={[
              { header: "Unit", cell: (l) => `${l.unit.title}, ${l.unit.city}` },
              { header: "Rent", cell: (l) => `PKR ${Number(l.rentAmount).toLocaleString()}/mo` },
              { header: "Status", cell: (l) => <StatusBadge status={l.status} /> },
            ]}
          />
        </DetailSection>
      )}

      {data.listings.length === 0 && data.requirements.length === 0 && data.leasesAsTenant.length === 0 && (
        <p className="font-body text-sm text-ink-faint">No listings, requirements, or leases for this account yet.</p>
      )}
    </div>
  );
}
