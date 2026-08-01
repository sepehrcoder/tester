"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/marketing/AuthShell";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth, ApiError } from "@/providers/AuthProvider";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState<"CUSTOMER" | "DEALER">("CUSTOMER");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await register({ name, phone, password, role });
      const params = new URLSearchParams({ phone });
      if (result.devCode) params.set("devCode", result.devCode);
      router.push(`/verify-otp?${params.toString()}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell title="Create an account" subtitle="Buying, selling, or dealing — pick what fits.">
      <div className="mb-5 flex gap-2">
        {(["CUSTOMER", "DEALER"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={role === r ? "" : "opacity-60"}
          >
            <Badge variant={role === r ? "ember" : "ghost"}>{r === "CUSTOMER" ? "Buyer / Owner" : "Dealer"}</Badge>
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <TextField label="Full name" name="name" value={name} onChange={(e) => setName(e.target.value)} required />
        <TextField
          label="Phone number"
          name="phone"
          type="tel"
          placeholder="+923001234567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="font-body text-sm text-ember">{error}</p>}
        <Button variant="primary" type="submit" disabled={submitting} className="mt-2 justify-center">
          {submitting ? "Creating account…" : "Continue"}
        </Button>
      </form>
      <p className="mt-6 font-body text-sm text-ink-soft">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-ember">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
