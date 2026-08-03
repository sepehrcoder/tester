"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Table } from "@/components/shared/Table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { useAuthedFetch } from "@/lib/useAuthedFetch";

interface Listing {
  id: string;
  title: string;
  city: string;
  area: string;
  price: string;
  status: string;
  verified: boolean;
  viewCount: number;
  createdAt: string;
}

export default function MyListingsPage() {
  const { data, loading, error } = useAuthedFetch<Listing[]>("/listings/mine");

  return (
    <div>
      <PageHeader title="My listings" subtitle="Properties you've listed yourself, and their moderation status." />

      {loading && <p className="font-body text-sm text-ink-soft">Loading…</p>}
      {error && <p className="font-body text-sm text-ember">{error}</p>}

      {data && (
        <Table
          rows={data}
          keyFor={(l) => l.id}
          emptyMessage="You haven't listed a property yet."
          columns={[
            {
              header: "Listing",
              cell: (l) => (
                <div>
                  <p className="font-semibold">{l.title}</p>
                  <p className="text-xs text-ink-soft">
                    {l.area}, {l.city}
                  </p>
                </div>
              ),
            },
            { header: "Price", cell: (l) => `PKR ${Number(l.price).toLocaleString()}`, className: "tabular" },
            { header: "Status", cell: (l) => <StatusBadge status={l.status} /> },
            { header: "Verified", cell: (l) => (l.verified ? <Badge variant="teal">Yes</Badge> : <Badge variant="ghost">No</Badge>) },
            { header: "Views", cell: (l) => l.viewCount.toLocaleString(), className: "tabular" },
            { header: "Posted", cell: (l) => new Date(l.createdAt).toLocaleDateString() },
          ]}
        />
      )}
    </div>
  );
}
