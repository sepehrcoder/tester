import type { ReactNode } from "react";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <>
      <div className="aurora-backdrop" />
      <div className="flex min-h-full flex-1 items-center justify-center px-4 py-16">
        <div className="surface-glass w-full max-w-sm p-8">
          <h1 className="font-display text-2xl font-extrabold text-ink">{title}</h1>
          <p className="mt-2 font-body text-sm text-ink-soft">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </>
  );
}
