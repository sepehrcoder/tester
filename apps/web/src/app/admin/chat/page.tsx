"use client";

import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { Table } from "@/components/shared/Table";
import { Badge } from "@/components/ui/Badge";
import { useAuthedFetch } from "@/lib/useAuthedFetch";

interface Conversation {
  id: string;
  participants: { user: { id: string; name: string; role: string } }[];
  messages: { body: string; createdAt: string }[];
  _count: { messages: number };
}

export default function AdminChatListPage() {
  const { data, loading, error } = useAuthedFetch<Conversation[]>("/admin/chat/conversations");

  return (
    <div>
      <PageHeader title="Chat monitoring" subtitle="Every conversation on the platform — open any thread to read it in full." />
      {loading && <p className="font-body text-sm text-ink-soft">Loading…</p>}
      {error && <p className="font-body text-sm text-ember">{error}</p>}
      {data && (
        <Table
          rows={data}
          keyFor={(c) => c.id}
          emptyMessage="No conversations yet."
          columns={[
            {
              header: "Participants",
              cell: (c) => (
                <Link href={`/admin/chat/${c.id}`} className="font-semibold text-ink hover:text-ember">
                  {c.participants.map((p) => p.user.name).join(" ↔ ")}
                </Link>
              ),
            },
            {
              header: "Last message",
              cell: (c) => <span className="text-ink-soft">{c.messages[0]?.body ?? "—"}</span>,
            },
            {
              header: "Flagged",
              cell: (c) => (c._count.messages > 0 ? <Badge variant="ember">{c._count.messages}</Badge> : "—"),
            },
          ]}
        />
      )}
    </div>
  );
}
