import type { InputHTMLAttributes } from "react";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function TextField({ label, id, className, ...props }: TextFieldProps) {
  const fieldId = id ?? props.name;
  return (
    <label htmlFor={fieldId} className="flex flex-col gap-1.5">
      <span className="font-body text-xs font-bold uppercase tracking-wide text-ink-soft">{label}</span>
      <input
        id={fieldId}
        className={`rounded-sm border border-flat-border bg-flat px-4 py-3 font-body text-sm text-ink outline-none placeholder:text-ink-faint focus:border-ember ${className ?? ""}`}
        {...props}
      />
    </label>
  );
}
