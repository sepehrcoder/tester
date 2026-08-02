"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { useAuthedFetch } from "@/lib/useAuthedFetch";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

interface Stats {
  company: { id: string; name: string } | null;
}

export default function DealerCompanyPage() {
  const { accessToken } = useAuth();
  const { data, loading, error, refetch } = useAuthedFetch<Stats>("/users/me/stats");
  const [inviteCode, setInviteCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function joinCompany() {
    setBusy(true);
    setFormError(null);
    try {
      await apiFetch("/users/me/dealer-profile/join-company", {
        method: "POST",
        token: accessToken,
        body: { inviteCode },
      });
      setInviteCode("");
      refetch();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function leaveCompany() {
    setBusy(true);
    try {
      await apiFetch("/users/me/dealer-profile/leave-company", { method: "POST", token: accessToken });
      refetch();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title="Company" subtitle="Join an agency's company account so its manager can see your performance." />

      {loading && <p className="font-body text-sm text-ink-soft">Loading…</p>}
      {error && <p className="font-body text-sm text-ember">{error}</p>}

      {data && (
        <div className="surface-flat max-w-md p-6">
          {data.company ? (
            <>
              <p className="font-body text-sm text-ink-soft">You&apos;re part of</p>
              <p className="mt-1 font-display text-xl font-extrabold text-ink">{data.company.name}</p>
              <p className="mt-3 font-body text-xs text-ink-faint">
                The company manager can see your leads, listings, and stats — but can&apos;t act on your behalf.
              </p>
              <Button variant="ghost" className="mt-4" disabled={busy} onClick={leaveCompany}>
                {busy ? "Leaving…" : "Leave company"}
              </Button>
            </>
          ) : (
            <>
              <p className="font-body text-sm text-ink-soft">
                Not part of a company yet. Ask your agency&apos;s manager for their invite code to join.
              </p>
              <div className="mt-4 flex flex-col gap-3">
                <TextField
                  label="Invite code"
                  name="inviteCode"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                />
                {formError && <p className="font-body text-sm text-ember">{formError}</p>}
                <Button variant="primary" disabled={busy || !inviteCode} onClick={joinCompany}>
                  {busy ? "Joining…" : "Join company"}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
