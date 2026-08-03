"use client";

import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { Table } from "@/components/shared/Table";
import { Badge } from "@/components/ui/Badge";
import { useAuthedFetch } from "@/lib/useAuthedFetch";

interface AdminUser {
  id: string;
  role: string;
  name: string;
  phone: string;
  email: string | null;
  phoneVerifiedAt: string | null;
  createdAt: string;
}

export default function AdminUsersPage() {
  const { data, loading, error } = useAuthedFetch<AdminUser[]>("/admin/users");

  return (
    <div>
      <PageHeader title="Users" subtitle="Every non-dealer account on the platform — customers, companies, tenants, and plaza managers." />
      {loading && <p className="font-body text-sm text-ink-soft">Loading…</p>}
      {error && <p className="font-body text-sm text-ember">{error}</p>}
      {data && (
        <Table
          rows={data}
          keyFor={(u) => u.id}
          emptyMessage="No users yet."
          columns={[
            {
              header: "Name",
              cell: (u) => (
                <Link href={`/admin/users/${u.id}`} className="font-semibold hover:underline">
                  {u.name}
                </Link>
              ),
            },
            { header: "Role", cell: (u) => <Badge variant="ghost">{u.role.replaceAll("_", " ")}</Badge> },
            { header: "Phone", cell: (u) => u.phone },
            { header: "Email", cell: (u) => u.email ?? "—" },
            {
              header: "Verified",
              cell: (u) => (u.phoneVerifiedAt ? <Badge variant="teal">Verified</Badge> : <Badge variant="ghost">Unverified</Badge>),
            },
            { header: "Joined", cell: (u) => new Date(u.createdAt).toLocaleDateString() },
          ]}
        />
      )}
    </div>
  );
}
