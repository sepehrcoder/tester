import Link from "next/link";
import { IconBuilding, IconHome, IconMapPin, IconVerified } from "@repo/icons/web";
import { AppNav } from "@/components/marketing/AppNav";
import { MarketingSearchBar } from "@/components/marketing/SearchBar";
import { PropertyCard, type Property } from "@/components/marketing/PropertyCard";
import { Button } from "@/components/ui/Button";
import { API_URL } from "@/lib/api";
import { formatPKR } from "@/lib/price";

interface ApiListing {
  id: string;
  price: string;
  title: string;
  city: string;
  area: string;
  beds: number | null;
  verified: boolean;
  promoTier: string;
  source: "DEALER" | "OWNER";
  photos: { url: string }[];
}

function toProperty(item: ApiListing): Property {
  return {
    id: item.id,
    price: formatPKR(item.price),
    title: item.title,
    location: `${item.area}, ${item.city}`,
    verified: item.verified,
    promoTier: item.promoTier,
    tag: item.beds ? `${item.beds} bed` : item.source === "OWNER" ? "Owner listed" : "Listing",
    photoUrl: item.photos[0]?.url,
  };
}

const SAMPLE_LISTINGS: Property[] = [
  { price: "PKR 1,85,00,000", title: "5 Marla, 3 bed corner plot", location: "Bahria Town, Phase 7, Lahore", tag: "3 bed", verified: true },
  { price: "PKR 92,00,000", title: "10 Marla residential plot", location: "Gulberg Greens, Lahore", tag: "Owner listed" },
  { price: "PKR 3,20,00,000", title: "1 Kanal, west-facing villa", location: "DHA Phase 6, Lahore", tag: "6 bed", verified: true },
];

const CATEGORIES = [
  { label: "Houses", icon: IconHome, params: { propertyType: "HOUSE" } },
  { label: "Apartments", icon: IconBuilding, params: { propertyType: "APARTMENT" } },
  { label: "Plots", icon: IconMapPin, params: { propertyType: "PLOT" } },
  { label: "Commercial", icon: IconBuilding, params: { propertyType: "COMMERCIAL" } },
];

const CITIES = ["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad"];

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export default async function Home() {
  const [listingsRes, featuredRes, stats] = await Promise.all([
    getJson<{ items: ApiListing[] }>("/listings?pageSize=6"),
    getJson<{ items: ApiListing[] }>("/listings?pageSize=4"),
    getJson<{ totalListings: number; verifiedDealers: number; cities: number }>("/listings/stats"),
  ]);

  const live = listingsRes !== null;
  const listings = listingsRes ? listingsRes.items.map(toProperty) : SAMPLE_LISTINGS;
  const featured = (featuredRes?.items ?? []).filter((l) => l.promoTier !== "STANDARD").map(toProperty);

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

          <section className="mb-10">
            <h2 className="mb-3 font-display text-sm font-bold text-ink">Browse by category</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {CATEGORIES.map(({ label, icon: Icon, params }) => (
                <Link
                  key={label}
                  href={`/listings?${new URLSearchParams(params).toString()}`}
                  className="surface-flat flex flex-col items-center gap-2 p-5 text-center transition-transform hover:scale-[1.02]"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-pill bg-ember-soft text-ember">
                    <Icon size={20} />
                  </span>
                  <span className="font-body text-sm font-semibold text-ink">{label}</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="mb-10">
            <h2 className="mb-3 font-display text-sm font-bold text-ink">Browse by city</h2>
            <div className="flex flex-wrap gap-2">
              {CITIES.map((city) => (
                <Link
                  key={city}
                  href={`/listings?city=${encodeURIComponent(city)}`}
                  className="surface-flat px-4 py-2 font-body text-sm font-semibold text-ink-soft transition-colors hover:text-ink"
                >
                  {city}
                </Link>
              ))}
            </div>
          </section>

          {featured.length > 0 && (
            <section className="mb-10">
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="font-display text-sm font-bold text-ink">Featured listings</h2>
                <Link href="/listings" className="font-body text-xs font-semibold text-teal">
                  See all →
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {featured.map((l) => (
                  <PropertyCard key={l.id} {...l} />
                ))}
              </div>
            </section>
          )}

          {stats && (
            <section className="surface-glass mb-10 grid grid-cols-3 gap-4 p-6 text-center">
              <div>
                <p className="font-display text-2xl font-extrabold text-ink">{stats.totalListings.toLocaleString()}+</p>
                <p className="font-body text-xs text-ink-faint">Live listings</p>
              </div>
              <div>
                <p className="font-display text-2xl font-extrabold text-ink">{stats.verifiedDealers.toLocaleString()}+</p>
                <p className="font-body text-xs text-ink-faint">Verified dealers</p>
              </div>
              <div>
                <p className="font-display text-2xl font-extrabold text-ink">{stats.cities}</p>
                <p className="font-body text-xs text-ink-faint">Cities covered</p>
              </div>
            </section>
          )}

          <section>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="font-display text-sm font-bold text-ink">Recent listings</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((l) => (
                <PropertyCard key={l.id ?? l.title} {...l} />
              ))}
            </div>
          </section>

          <div className="mt-6 text-center">
            <Link href="/listings" className="font-body text-sm font-semibold text-teal">
              See all listings →
            </Link>
          </div>
        </main>

        <footer className="border-t border-flat-border px-4 py-8">
          <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="font-display text-sm font-bold text-ink">Manzil</p>
            <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-body text-xs text-ink-soft">
              <Link href="/about" className="hover:text-ink">About</Link>
              <Link href="/dealers" className="hover:text-ink">Dealers</Link>
              <Link href="/news" className="hover:text-ink">News</Link>
              <Link href="/contact" className="hover:text-ink">Contact</Link>
              <Link href="/terms" className="hover:text-ink">Terms</Link>
              <Link href="/privacy" className="hover:text-ink">Privacy</Link>
            </nav>
            <p className="font-body text-xs text-ink-faint">© {new Date().getFullYear()} Manzil</p>
          </div>
        </footer>
      </div>
    </>
  );
}
