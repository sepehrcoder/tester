"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LeaseChatPanel } from "@/components/shared/LeaseChatPanel";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

interface Lease {
  id: string;
  status: string;
}

export default function TenantChatPage() {
  const { accessToken } = useAuth();
  const [lease, setLease] = useState<Lease | null | undefined>(undefined);

  useEffect(() => {
    apiFetch<Lease[]>("/leases/mine", { token: accessToken }).then((leases) => {
      setLease(leases.find((l) => l.status === "ACTIVE") ?? null);
    });
  }, [accessToken]);

  return (
    <div>
      <PageHeader title="Chat" subtitle="Message your owner or plaza manager directly." />
      {lease === undefined && <p className="font-body text-sm text-ink-soft">Loading…</p>}
      {lease === null && <p className="font-body text-sm text-ink-soft">No active lease yet.</p>}
      {lease && <LeaseChatPanel leaseId={lease.id} />}
    </div>
  );
}
