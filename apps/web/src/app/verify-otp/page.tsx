"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/marketing/AuthShell";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { useAuth, ApiError } from "@/providers/AuthProvider";

function VerifyOtpForm() {
  const { verifyOtp } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const phone = params.get("phone") ?? "";
  const devCode = params.get("devCode") ?? "";

  const [code, setCode] = useState(devCode);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await verifyOtp(phone, code);
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell title="Verify your number" subtitle={`We sent a 6-digit code to ${phone || "your phone"}.`}>
      {devCode && (
        <p className="mb-4 font-body text-xs text-teal">
          Dev mode: code pre-filled below ({devCode}) — OTP delivery isn&apos;t wired to a real SMS provider yet.
        </p>
      )}
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <TextField
          label="6-digit code"
          name="code"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />
        {error && <p className="font-body text-sm text-ember">{error}</p>}
        <Button variant="primary" type="submit" disabled={submitting} className="mt-2 justify-center">
          {submitting ? "Verifying…" : "Verify & continue"}
        </Button>
      </form>
    </AuthShell>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={null}>
      <VerifyOtpForm />
    </Suspense>
  );
}
