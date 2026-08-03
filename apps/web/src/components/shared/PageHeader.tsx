import type { ReactNode } from "react";
import Link from "next/link";

export function PageHeader({
  title,
  subtitle,
  action,
  backHref,
  backLabel = "Back",
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        {backHref && (
          <Link href={backHref} className="mb-1 inline-block font-body text-xs font-semibold text-teal">
            ← {backLabel}
          </Link>
        )}
        <h1 className="font-display text-2xl font-extrabold text-ink">{title}</h1>
        {subtitle && <p className="mt-1 font-body text-sm text-ink-soft">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
