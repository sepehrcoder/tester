import { IconBell, IconSearch, IconUpload } from "@repo/icons/web";
import { Button } from "@/components/ui/Button";

export function AppNav() {
  return (
    <header className="surface-glass-strong sticky top-4 z-10 mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3">
      <span className="font-display text-lg font-extrabold tracking-tight text-ink">Manzil</span>

      <nav className="hidden items-center gap-6 font-body text-sm font-semibold text-ink-soft md:flex">
        <a href="#" className="text-ink">
          Buy
        </a>
        <a href="#">Rent</a>
        <a href="#">Post a requirement</a>
        <a href="#">Find dealers</a>
      </nav>

      <div className="flex items-center gap-3">
        <button aria-label="Search" className="text-ink-soft hover:text-ink">
          <IconSearch size={19} />
        </button>
        <button aria-label="Notifications" className="text-ink-soft hover:text-ink">
          <IconBell size={19} />
        </button>
        <Button variant="ghost" className="hidden sm:inline-flex">
          <IconUpload size={15} />
          List a property
        </Button>
        <Button variant="primary">Sign in</Button>
      </div>
    </header>
  );
}
