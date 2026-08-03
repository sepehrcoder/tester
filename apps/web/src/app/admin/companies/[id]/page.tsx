"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { DetailSection, FactGrid } from "@/components/shared/DetailSection";
import { Table } from "@/components/shared/Table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAuthedFetch } from "@/lib/useAuthedFetch";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

interface CompanyDetail {
  id: string;
  name: string;
  inviteCode: string;
  createdAt: string;
  owner: { id: string; name: string; phone: string };
  dealers: { userId: string; agencyName: string | null; kycStatus: string; user: { id: string; name: string; phone: string } }[];
}

export default function AdminCompanyDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { accessToken } = useAuth();
  const { data, loading, error, refetch } = useAuthedFetch<CompanyDetail>(`/admin/companies/${params.id}`);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");

  function startEdit() {
    if (!data) return;
    setName(data.name);
    setEditing(true);
  }

  async function saveName() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await apiFetch(`/admin/companies/${params.id}`, { method: "PATCH", token: accessToken, body: { name: name.trim() } });
      setEditing(false);
      refetch();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function deleteCompany() {
    if (!confirm("Delete this company? Only possible once it has zero dealers.")) return;
    setBusy(true);
    try {
      await apiFetch(`/admin/companies/${params.id}`, { method: "DELETE", token: accessToken });
      router.push("/admin/companies");
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
      <PageHeader backHref="/admin/companies" backLabel="All companies" title={data.name} subtitle={`Owned by ${data.owner.name}`} />

      <div className="mb-5 flex flex-wrap gap-2">
        <button
          disabled={busy}
          onClick={startEdit}
          className="rounded-sm bg-flat px-3 py-1.5 font-body text-xs font-bold text-ink-soft disabled:opacity-50"
        >
          Edit name
        </button>
        <button
          disabled={busy || data.dealers.length > 0}
          onClick={deleteCompany}
          title={data.dealers.length > 0 ? "Move or remove its dealers first" : undefined}
          className="rounded-sm bg-ember px-3 py-1.5 font-body text-xs font-bold text-ember-ink disabled:opacity-50"
        >
          Delete
        </button>
      </div>

      {editing && (
        <DetailSection title="Rename company">
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-64 rounded-sm border border-flat-border bg-flat px-3 py-2 font-body text-sm text-ink outline-none"
            />
            <button
              disabled={busy}
              onClick={saveName}
              className="rounded-sm bg-teal-soft px-3 py-1.5 font-body text-xs font-bold text-teal disabled:opacity-50"
            >
              Save
            </button>
            <button onClick={() => setEditing(false)} className="font-body text-xs font-semibold text-ink-faint">
              Cancel
            </button>
          </div>
        </DetailSection>
      )}

      <DetailSection title="Info">
        <FactGrid
          items={[
            { label: "Owner", value: `${data.owner.name} (${data.owner.phone})` },
            { label: "Invite code", value: <span className="font-mono">{data.inviteCode}</span> },
            { label: "Created", value: new Date(data.createdAt).toLocaleDateString() },
            { label: "Dealers", value: data.dealers.length },
          ]}
        />
      </DetailSection>

      <DetailSection title={`Dealer roster (${data.dealers.length})`}>
        <Table
          rows={data.dealers}
          keyFor={(d) => d.userId}
          emptyMessage="No dealers have joined via this company's invite code yet."
          columns={[
            { header: "Dealer", cell: (d) => d.user.name },
            { header: "Agency", cell: (d) => d.agencyName ?? "—" },
            { header: "Phone", cell: (d) => d.user.phone },
            { header: "KYC", cell: (d) => <StatusBadge status={d.kycStatus} /> },
          ]}
        />
      </DetailSection>
    </div>
  );
}
