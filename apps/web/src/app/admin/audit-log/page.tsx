"use client";

import { PageHeader } from "@/components/admin/PageHeader";
import { Table } from "@/components/admin/Table";
import { useAdminFetch } from "@/lib/useAdminFetch";

interface AuditEntry {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  createdAt: string;
  actor: { name: string };
}

export default function AdminAuditLogPage() {
  const { data, loading, error } = useAdminFetch<AuditEntry[]>("/admin/audit-log");

  return (
    <div>
      <PageHeader title="Audit log" subtitle="Every moderation action taken by an admin, timestamped." />
      {loading && <p className="font-body text-sm text-ink-soft">Loading…</p>}
      {error && <p className="font-body text-sm text-ember">{error}</p>}
      {data && (
        <Table
          rows={data}
          keyFor={(a) => a.id}
          emptyMessage="No admin actions logged yet."
          columns={[
            { header: "Admin", cell: (a) => a.actor.name },
            { header: "Action", cell: (a) => <span className="font-mono text-xs">{a.action}</span> },
            { header: "Target", cell: (a) => `${a.targetType} · ${a.targetId.slice(0, 10)}…` },
            { header: "When", cell: (a) => new Date(a.createdAt).toLocaleString() },
          ]}
        />
      )}
    </div>
  );
}
