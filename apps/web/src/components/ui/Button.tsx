import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

const base =
  "inline-flex items-center gap-2 rounded-sm px-5 py-3 font-body text-sm font-bold transition-transform active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-ember focus-visible:outline-offset-2";

const variants: Record<Variant, string> = {
  primary: "bg-ember text-ember-ink shadow-ember-glow",
  secondary: "bg-transparent text-teal border-[1.5px] border-teal",
  ghost: "surface-glass text-ink",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

export function Button({ variant = "primary", className, children, ...props }: ButtonProps) {
  return (
    <button className={`${base} ${variants[variant]} ${className ?? ""}`} {...props}>
      {children}
    </button>
  );
}
