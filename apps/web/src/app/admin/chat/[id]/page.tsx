"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { useAdminFetch } from "@/lib/useAdminFetch";
import { IconArrowLeft } from "@repo/icons/web";

interface Message {
  id: string;
  body: string;
  flagged: boolean;
  flagReason: string | null;
  createdAt: string;
  sender: { id: string; name: string; role: string };
}

export default function AdminChatThreadPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useAdminFetch<Message[]>(`/admin/chat/conversations/${id}/messages`);

  return (
    <div>
      <Link href="/admin/chat" className="mb-4 inline-flex items-center gap-1.5 font-body text-sm text-ink-soft hover:text-ink">
        <IconArrowLeft size={15} />
        Back to conversations
      </Link>
      <PageHeader title="Conversation" subtitle="Read-only — admin view of the full thread." />

      {loading && <p className="font-body text-sm text-ink-soft">Loading…</p>}
      {error && <p className="font-body text-sm text-ember">{error}</p>}

      {data && (
        <div className="surface-flat flex flex-col gap-3 p-5">
          {data.map((m) => (
            <div key={m.id} className={m.flagged ? "rounded-sm border border-ember/40 bg-ember/10 p-3" : "p-1"}>
              <div className="flex items-center gap-2">
                <span className="font-body text-xs font-bold text-ink">{m.sender.name}</span>
                <span className="font-body text-[10px] uppercase text-ink-faint">{m.sender.role}</span>
                <span className="font-body text-[10px] text-ink-faint">{new Date(m.createdAt).toLocaleString()}</span>
                {m.flagged && <Badge variant="ember">Flagged</Badge>}
              </div>
              <p className="mt-1 font-body text-sm text-ink">{m.body}</p>
              {m.flagged && m.flagReason && <p className="mt-1 font-body text-xs text-ember">{m.flagReason}</p>}
            </div>
          ))}
          {data.length === 0 && <p className="font-body text-sm text-ink-soft">No messages in this conversation yet.</p>}
        </div>
      )}
    </div>
  );
}
