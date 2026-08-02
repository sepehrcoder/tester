"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LeaseChatPanel } from "@/components/shared/LeaseChatPanel";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

interface Lease {
  id: string;
  status: string;
}

export default function TenantChatPage() {
  const { accessToken } = useAuth();
  const [lease, setLease] = useState<Lease | null | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoadError(null);
    try {
      const leases = await apiFetch<Lease[]>("/leases/mine", { token: accessToken });
      setLease(leases.find((l) => l.status === "ACTIVE") ?? null);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }, [accessToken]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
  }, [reload]);

  return (
    <div>
      <PageHeader title="Chat" subtitle="Message your owner or plaza manager directly." />
      {lease === undefined && !loadError && <p className="font-body text-sm text-ink-soft">Loading…</p>}
      {loadError && (
        <div className="mb-4 flex items-center gap-3">
          <p className="font-body text-sm text-ember">{loadError}</p>
          <button onClick={reload} className="font-body text-sm font-semibold text-teal">
            Retry
          </button>
        </div>
      )}
      {lease === null && !loadError && <p className="font-body text-sm text-ink-soft">No active lease yet.</p>}
      {lease && <LeaseChatPanel leaseId={lease.id} />}
    </div>
  );
}
