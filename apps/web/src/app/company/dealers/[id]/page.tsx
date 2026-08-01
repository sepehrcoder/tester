"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Table } from "@/components/shared/Table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { StatCard } from "@/components/shared/StatCard";
import { useAuthedFetch } from "@/lib/useAuthedFetch";

interface DealerDetail {
  profile: {
    agencyName: string | null;
    kycStatus: string;
    coverageCities: string[];
    ratingAvg: number;
    ratingCount: number;
    user: { name: string; phone: string; createdAt: string };
  };
  assignments: {
    id: string;
    acceptedAt: string;
    outcome: string | null;
    lead: {
      status: string;
      requirement: { propertyType: string; purpose: string; city: string };
    };
  }[];
  listings: { id: string; title: string; city: string; status: string; price: string }[];
}

export default function CompanyDealerDetailPage() {
  const params = useParams<{ id: string }>();
  const { data, loading, error } = useAuthedFetch<DealerDetail>(`/company/dealers/${params.id}`);

  return (
    <div>
      <PageHeader
        title={data ? data.profile.user.name : "Dealer"}
        subtitle={data ? data.profile.agencyName ?? data.profile.user.phone : "Loading…"}
      />

      {loading && <p className="font-body text-sm text-ink-soft">Loading…</p>}
      {error && <p className="font-body text-sm text-ember">{error}</p>}

      {data && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="KYC" value={data.profile.kycStatus} />
            <StatCard label="Leads handled" value={data.assignments.length} />
            <StatCard label="Listings" value={data.listings.length} />
            <StatCard
              label="Rating"
              value={data.profile.ratingCount > 0 ? `${data.profile.ratingAvg.toFixed(1)} ★` : "No reviews"}
            />
          </div>

          <h2 className="mb-3 font-display text-lg font-bold text-ink">Lead history</h2>
          <Table
            rows={data.assignments}
            keyFor={(a) => a.id}
            emptyMessage="No leads accepted yet."
            columns={[
              {
                header: "Requirement",
                cell: (a) => `${a.lead.requirement.propertyType} · ${a.lead.requirement.purpose} · ${a.lead.requirement.city}`,
              },
              { header: "Lead status", cell: (a) => <StatusBadge status={a.lead.status} /> },
              { header: "Outcome", cell: (a) => (a.outcome ? <StatusBadge status={a.outcome} /> : <span className="text-ink-faint">Open</span>) },
              { header: "Accepted", cell: (a) => new Date(a.acceptedAt).toLocaleDateString() },
            ]}
          />

          <h2 className="mb-3 mt-8 font-display text-lg font-bold text-ink">Listings</h2>
          <Table
            rows={data.listings}
            keyFor={(l) => l.id}
            emptyMessage="No listings yet."
            columns={[
              { header: "Title", cell: (l) => l.title },
              { header: "City", cell: (l) => l.city },
              { header: "Price", cell: (l) => `PKR ${Number(l.price).toLocaleString()}`, className: "tabular" },
              { header: "Status", cell: (l) => <StatusBadge status={l.status} /> },
            ]}
          />
        </>
      )}
    </div>
  );
}
