import Link from "next/link";
import { IconVerified } from "@repo/icons/web";
import { AppNav } from "@/components/marketing/AppNav";
import { MarketingSearchBar } from "@/components/marketing/SearchBar";
import { PropertyCard, type Property } from "@/components/marketing/PropertyCard";
import { Button } from "@/components/ui/Button";
import { API_URL } from "@/lib/api";

function formatPKR(value: number) {
  const rounded = Math.round(value).toString();
  const last3 = rounded.slice(-3);
  const rest = rounded.slice(0, -3);
  const grouped = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," : "";
  return `PKR ${grouped}${last3}`;
}

interface ApiListing {
  id: string;
  price: string;
  title: string;
  city: string;
  area: string;
  beds: number | null;
  verified: boolean;
  source: "DEALER" | "OWNER";
  photos: { url: string }[];
}

async function getListings(): Promise<{ listings: Property[]; live: boolean }> {
  try {
    const res = await fetch(`${API_URL}/listings?pageSize=6`, { cache: "no-store" });
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    const data: { items: ApiListing[] } = await res.json();
    return {
      live: true,
      listings: data.items.map((item) => ({
        id: item.id,
        price: formatPKR(Number(item.price)),
        title: item.title,
        location: `${item.area}, ${item.city}`,
        verified: item.verified,
        tag: item.beds ? `${item.beds} bed` : item.source === "OWNER" ? "Owner listed" : "Listing",
        photoUrl: item.photos[0]?.url,
      })),
    };
  } catch {
    // API not running (e.g. static preview) — fall back to sample data so the page still demos the design.
    return {
      live: false,
      listings: [
        { price: "PKR 1,85,00,000", title: "5 Marla, 3 bed corner plot", location: "Bahria Town, Phase 7, Lahore", tag: "3 bed", verified: true },
        { price: "PKR 92,00,000", title: "10 Marla residential plot", location: "Gulberg Greens, Lahore", tag: "Owner listed" },
        { price: "PKR 3,20,00,000", title: "1 Kanal, west-facing villa", location: "DHA Phase 6, Lahore", tag: "6 bed", verified: true },
      ],
    };
  }
}

export default async function Home() {
  const { listings, live } = await getListings();

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
              <Link href="/requirements/new">
                <Button variant="primary">Post a requirement</Button>
              </Link>
              <Link href="/dealers">
                <Button variant="secondary">
                  <IconVerified size={16} />
                  Browse verified dealers
                </Button>
              </Link>
            </div>
          </section>

          <MarketingSearchBar />

          {!live && (
            <p className="mb-4 font-body text-xs text-ink-faint">
              Showing sample listings — the API at {API_URL} isn&apos;t reachable right now.
            </p>
          )}

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => (
              <PropertyCard key={l.id ?? l.title} {...l} />
            ))}
          </section>

          <div className="mt-6 text-center">
            <Link href="/listings" className="font-body text-sm font-semibold text-teal">
              See all listings →
            </Link>
          </div>
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
