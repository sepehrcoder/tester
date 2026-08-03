import { AppNav } from "@/components/marketing/AppNav";

export default function TermsPage() {
  return (
    <>
      <div className="aurora-backdrop" />
      <div className="flex min-h-full flex-col">
        <div className="px-4 pt-4">
          <AppNav />
        </div>

        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-14">
          <h1 className="font-display text-3xl font-extrabold text-ink">Terms of service</h1>
          <p className="mt-2 font-body text-xs text-ink-faint">Last updated: this draft has not yet been reviewed by counsel.</p>

          <div className="mt-6 space-y-6 font-body text-sm text-ink-soft">
            <section>
              <h2 className="mb-2 font-display text-base font-bold text-ink">1. What Manzil is</h2>
              <p>
                Manzil connects buyers, renters, owners, and verified dealers. We moderate listings and review
                dealer KYC, but we are not a party to any sale, rental, or lease agreement made between users —
                you are responsible for verifying anything you agree to off-platform.
              </p>
            </section>
            <section>
              <h2 className="mb-2 font-display text-base font-bold text-ink">2. Accounts</h2>
              <p>
                You&apos;re responsible for the accuracy of what you post and for keeping your login credentials
                private. We may suspend or remove an account that posts fraudulent listings, impersonates
                another party, or is reported and confirmed to violate these terms.
              </p>
            </section>
            <section>
              <h2 className="mb-2 font-display text-base font-bold text-ink">3. Listings</h2>
              <p>
                Listings must accurately represent the property. Duplicate, misleading, or spam listings may be
                rejected or removed without notice. A &ldquo;Verified&rdquo; badge means we&apos;ve reviewed
                the listing against our checks — it is not a guarantee of the property&apos;s condition or the
                seller&apos;s title.
              </p>
            </section>
            <section>
              <h2 className="mb-2 font-display text-base font-bold text-ink">4. Payments</h2>
              <p>
                Never send money before signing a written agreement. Manzil does not process property payments
                and cannot reverse a transaction made outside the platform.
              </p>
            </section>
            <section>
              <h2 className="mb-2 font-display text-base font-bold text-ink">5. Changes</h2>
              <p>We may update these terms as the platform evolves. Material changes will be posted here.</p>
            </section>
          </div>
        </main>
      </div>
    </>
  );
}
