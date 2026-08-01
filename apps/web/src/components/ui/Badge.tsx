import type { ReactNode } from "react";

type Variant = "ember" | "teal" | "ghost";

const variants: Record<Variant, string> = {
  ember: "bg-ember text-ember-ink shadow-ember-glow",
  teal: "bg-teal-soft text-teal",
  ghost: "bg-ink-soft/15 text-ink-soft",
};

export function Badge({ variant = "ghost", children }: { variant?: Variant; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-pill px-2.5 py-1 font-body text-[11px] font-extrabold uppercase tracking-wide ${variants[variant]}`}
    >
      {children}
    </span>
  );
}
