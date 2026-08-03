import { AppNav } from "@/components/marketing/AppNav";

export default function AboutPage() {
  return (
    <>
      <div className="aurora-backdrop" />
      <div className="flex min-h-full flex-col">
        <div className="px-4 pt-4">
          <AppNav />
        </div>

        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-14">
          <h1 className="font-display text-3xl font-extrabold text-ink">About Manzil</h1>
          <p className="mt-4 font-body text-base text-ink-soft">
            Manzil is a real estate marketplace and property-management platform built for Pakistan — buy,
            rent, list, and manage property in one place, with verified dealers and a requirement-matching
            system that gets your search in front of every dealer who covers your area.
          </p>
          <p className="mt-4 font-body text-base text-ink-soft">
            Every dealer on Manzil goes through a KYC review before they can list. Every listing goes through
            moderation before it goes live. If something looks off, use the report button on any listing or
            profile — our team reviews every report.
          </p>
        </main>
      </div>
    </>
  );
}
