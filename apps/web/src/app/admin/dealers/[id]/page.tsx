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

interface DealerDetail {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  createdAt: string;
  suspendedAt: string | null;
  dealerProfile: {
    agencyName: string | null;
    licenseNumber: string | null;
    kycStatus: string;
    kycDocumentUrl: string | null;
    coverageCities: string[];
    propertyTypes: string[];
    ratingAvg: number;
    ratingCount: number;
    company: { id: string; name: string } | null;
  } | null;
  listings: { id: string; title: string; city: string; area: string; price: string; status: string }[];
  leadsAsDealer: {
    id: string;
    status: string;
    createdAt: string;
    requirement: { propertyType: string; purpose: string; city: string; area: string | null };
  }[];
  reviewsReceived: { id: string; rating: number; comment: string | null; createdAt: string; customer: { name: string } }[];
}

export default function AdminDealerDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { accessToken } = useAuth();
  const { data, loading, error, refetch } = useAuthedFetch<DealerDetail>(`/admin/dealers/${params.id}`);
  const [busy, setBusy] = useState(false);

  async function moderateKyc(status: "APPROVED" | "REJECTED") {
    setBusy(true);
    try {
      await apiFetch(`/admin/dealers/${params.id}/kyc`, { method: "PATCH", token: accessToken, body: { status } });
      refetch();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function toggleSuspend() {
    if (!data) return;
    setBusy(true);
    try {
      await apiFetch(`/admin/dealers/${params.id}/suspend`, {
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

  async function deleteDealer() {
    if (!confirm("Delete this dealer permanently? Their listings and leads go with them. This can't be undone.")) return;
    setBusy(true);
    try {
      await apiFetch(`/admin/dealers/${params.id}`, { method: "DELETE", token: accessToken });
      router.push("/admin/dealers");
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
        backHref="/admin/dealers"
        backLabel="All dealers"
        title={data.name}
        subtitle={data.dealerProfile?.agencyName ?? "Independent dealer"}
        action={
          <div className="flex flex-wrap gap-2">
            {data.suspendedAt ? (
              <Badge variant="ember">Suspended</Badge>
            ) : (
              <StatusBadge status={data.dealerProfile?.kycStatus ?? "UNSUBMITTED"} />
            )}
          </div>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {data.dealerProfile?.kycStatus === "PENDING" && (
          <>
            <button
              disabled={busy}
              onClick={() => moderateKyc("APPROVED")}
              className="rounded-sm bg-teal-soft px-3 py-1.5 font-body text-xs font-bold text-teal disabled:opacity-50"
            >
              Approve KYC
            </button>
            <button
              disabled={busy}
              onClick={() => moderateKyc("REJECTED")}
              className="rounded-sm bg-ember px-3 py-1.5 font-body text-xs font-bold text-ember-ink disabled:opacity-50"
            >
              Reject KYC
            </button>
          </>
        )}
        <button
          disabled={busy}
          onClick={toggleSuspend}
          className="rounded-sm bg-flat px-3 py-1.5 font-body text-xs font-bold text-ink-soft disabled:opacity-50"
        >
          {data.suspendedAt ? "Reinstate" : "Suspend"}
        </button>
        <button
          disabled={busy}
          onClick={deleteDealer}
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
            { label: "License #", value: data.dealerProfile?.licenseNumber ?? "—" },
            { label: "Coverage", value: data.dealerProfile?.coverageCities.join(", ") || "—" },
            { label: "Property types", value: data.dealerProfile?.propertyTypes.join(", ") || "—" },
            {
              label: "Rating",
              value:
                data.dealerProfile && data.dealerProfile.ratingCount > 0
                  ? `${data.dealerProfile.ratingAvg.toFixed(1)} (${data.dealerProfile.ratingCount})`
                  : "No reviews yet",
            },
            { label: "Company", value: data.dealerProfile?.company?.name ?? "None" },
            { label: "Member since", value: new Date(data.createdAt).toLocaleDateString() },
          ]}
        />
        {data.dealerProfile?.kycDocumentUrl && (
          <a
            href={data.dealerProfile.kycDocumentUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block font-body text-xs font-semibold text-teal"
          >
            View KYC document ↗
          </a>
        )}
      </DetailSection>

      <DetailSection title={`Listings (${data.listings.length})`}>
        <Table
          rows={data.listings}
          keyFor={(l) => l.id}
          emptyMessage="No listings from this dealer yet."
          columns={[
            { header: "Title", cell: (l) => l.title },
            { header: "Location", cell: (l) => `${l.area}, ${l.city}` },
            { header: "Price", cell: (l) => `PKR ${Number(l.price).toLocaleString()}` },
            { header: "Status", cell: (l) => <StatusBadge status={l.status} /> },
          ]}
        />
      </DetailSection>

      <DetailSection title={`Leads (${data.leadsAsDealer.length})`}>
        <Table
          rows={data.leadsAsDealer}
          keyFor={(l) => l.id}
          emptyMessage="No leads claimed yet."
          columns={[
            {
              header: "Requirement",
              cell: (l) => `${l.requirement.propertyType} · ${l.requirement.purpose} in ${l.requirement.area ? `${l.requirement.area}, ` : ""}${l.requirement.city}`,
            },
            { header: "Status", cell: (l) => <StatusBadge status={l.status} /> },
            { header: "Claimed", cell: (l) => new Date(l.createdAt).toLocaleDateString() },
          ]}
        />
      </DetailSection>

      <DetailSection title={`Reviews (${data.reviewsReceived.length})`}>
        {data.reviewsReceived.length === 0 ? (
          <p className="font-body text-sm text-ink-faint">No reviews yet.</p>
        ) : (
          <ul className="space-y-3">
            {data.reviewsReceived.map((r) => (
              <li key={r.id} className="border-b border-flat-border pb-3 last:border-0 last:pb-0">
                <p className="font-body text-sm font-bold text-ink">
                  {"★".repeat(r.rating)}
                  {"☆".repeat(5 - r.rating)} <span className="font-normal text-ink-faint">— {r.customer.name}</span>
                </p>
                {r.comment && <p className="mt-1 font-body text-sm text-ink-soft">{r.comment}</p>}
              </li>
            ))}
          </ul>
        )}
      </DetailSection>
    </div>
  );
}
