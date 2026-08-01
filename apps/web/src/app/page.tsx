import { IconFilter, IconSearch, IconVerified } from "@repo/icons/web";
import { AppNav } from "@/components/marketing/AppNav";
import { PropertyCard } from "@/components/marketing/PropertyCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

const listings = [
  { price: "PKR 1,85,00,000", title: "5 Marla, 3 bed corner plot", location: "Bahria Town, Phase 7", tag: "3 bed", verified: true },
  { price: "PKR 92,00,000", title: "10 Marla residential plot", location: "Gulberg Greens", tag: "Owner listed" },
  { price: "PKR 3,20,00,000", title: "1 Kanal, west-facing villa", location: "DHA Phase 6", tag: "6 bed", verified: true },
  { price: "PKR 1,10,00,000", title: "3 bed apartment, top floor", location: "Askari 11", tag: "3 bed", verified: true },
  { price: "PKR 65,00,000", title: "5 Marla plot, near park", location: "Model Town Extension", tag: "Owner listed" },
  { price: "PKR 2,45,00,000", title: "8 Marla, double-story house", location: "Wapda Town", tag: "5 bed", verified: true },
];

const filters = ["For sale", "For rent", "Houses", "Plots", "Apartments", "Verified only"];

export default function Home() {
  return (
    <>
      <div className="aurora-backdrop" />
      <div className="flex min-h-full flex-col">
        <div className="px-4 pt-4">
          <AppNav />
        </div>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-14">
          <section className="mb-10">
            <span className="mb-4 inline-flex items-center gap-2 font-body text-xs font-extrabold uppercase tracking-widest text-ember">
              <span className="h-1.5 w-1.5 rounded-pill bg-ember shadow-ember-glow" />
              Buy · Rent · List · Chat — all in one place
            </span>
            <h1 className="max-w-xl font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
              Find your next home, or let a verified dealer find it for you.
            </h1>
            <p className="mt-4 max-w-lg font-body text-base text-ink-soft">
              Can&apos;t find what you need? Post your requirement and every matched dealer in your
              area gets notified — first to respond and follow through gets the client.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="primary">Post a requirement</Button>
              <Button variant="secondary">
                <IconVerified size={16} />
                Browse verified dealers
              </Button>
            </div>
          </section>

          <section className="surface-glass mb-8 flex flex-wrap items-center gap-3 p-4">
            <div className="flex flex-1 items-center gap-2 rounded-sm border border-flat-border bg-flat px-3 py-2 text-ink-soft">
              <IconSearch size={16} />
              <input
                className="w-full bg-transparent font-body text-sm text-ink outline-none placeholder:text-ink-faint"
                placeholder="Search city, area, or project"
              />
            </div>
            <button className="flex items-center gap-1.5 font-body text-sm font-semibold text-ink-soft hover:text-ink">
              <IconFilter size={16} />
              Filters
            </button>
          </section>

          <section className="mb-6 flex flex-wrap gap-2">
            {filters.map((f) => (
              <Badge key={f} variant={f === "Verified only" ? "teal" : "ghost"}>
                {f}
              </Badge>
            ))}
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => (
              <PropertyCard key={l.title} {...l} />
            ))}
          </section>
        </main>

        <footer className="px-4 pb-10 pt-6 text-center font-body text-xs text-ink-faint">
          Aurora Glass design system — foundation build. See{" "}
          <code className="text-ink-soft">packages/theme</code> for tokens and{" "}
          <code className="text-ink-soft">packages/icons</code> for the shared icon set.
        </footer>
      </div>
    </>
  );
}
