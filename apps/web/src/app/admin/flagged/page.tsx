"use client";

import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { Table } from "@/components/shared/Table";
import { useAuthedFetch } from "@/lib/useAuthedFetch";

interface FlaggedMessage {
  id: string;
  body: string;
  flagReason: string | null;
  createdAt: string;
  sender: { name: string; role: string };
  conversation: { id: string };
}

export default function AdminFlaggedPage() {
  const { data, loading, error } = useAuthedFetch<FlaggedMessage[]>("/admin/chat/flagged");

  return (
    <div>
      <PageHeader
        title="Flagged queue"
        subtitle="Messages auto-detected as containing a phone number or an off-platform contact attempt."
      />
      {loading && <p className="font-body text-sm text-ink-soft">Loading…</p>}
      {error && <p className="font-body text-sm text-ember">{error}</p>}
      {data && (
        <Table
          rows={data}
          keyFor={(m) => m.id}
          emptyMessage="Nothing flagged right now."
          columns={[
            { header: "From", cell: (m) => `${m.sender.name} (${m.sender.role})` },
            { header: "Message", cell: (m) => <span className="text-ink-soft">{m.body}</span> },
            { header: "Reason", cell: (m) => m.flagReason ?? "—" },
            {
              header: "Conversation",
              cell: (m) => (
                <Link href={`/admin/chat/${m.conversation.id}`} className="font-semibold text-ember">
                  Open thread
                </Link>
              ),
            },
            { header: "When", cell: (m) => new Date(m.createdAt).toLocaleString() },
          ]}
        />
      )}
    </div>
  );
}
