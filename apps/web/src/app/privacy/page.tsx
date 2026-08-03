import { AppNav } from "@/components/marketing/AppNav";

export default function PrivacyPage() {
  return (
    <>
      <div className="aurora-backdrop" />
      <div className="flex min-h-full flex-col">
        <div className="px-4 pt-4">
          <AppNav />
        </div>

        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-14">
          <h1 className="font-display text-3xl font-extrabold text-ink">Privacy policy</h1>
          <p className="mt-2 font-body text-xs text-ink-faint">Last updated: this draft has not yet been reviewed by counsel.</p>

          <div className="mt-6 space-y-6 font-body text-sm text-ink-soft">
            <section>
              <h2 className="mb-2 font-display text-base font-bold text-ink">What we collect</h2>
              <p>
                Your name, phone number, and email to create an account; listing details and photos you choose
                to publish; and message content within Manzil&apos;s chat, which our team can review for
                trust-and-safety purposes (see the flagged-message policy below).
              </p>
            </section>
            <section>
              <h2 className="mb-2 font-display text-base font-bold text-ink">Why we collect it</h2>
              <p>
                To operate the marketplace — matching your requirement to dealers, showing your listing to
                buyers, sending you notifications about leads and messages, and reviewing dealer KYC documents.
              </p>
            </section>
            <section>
              <h2 className="mb-2 font-display text-base font-bold text-ink">Message monitoring</h2>
              <p>
                Messages that trip an automated spam/scam filter are flagged for a human admin to review. We
                don&apos;t read conversations that aren&apos;t flagged.
              </p>
            </section>
            <section>
              <h2 className="mb-2 font-display text-base font-bold text-ink">Your contact details</h2>
              <p>
                Your phone number is shown to another user only once you start a conversation about a listing
                (or, for a listing&apos;s WhatsApp button, once someone taps it). It&apos;s never shown in
                search results or on an archive listing card.
              </p>
            </section>
            <section>
              <h2 className="mb-2 font-display text-base font-bold text-ink">Deleting your account</h2>
              <p>Contact support to request account deletion — see the Contact page.</p>
            </section>
          </div>
        </main>
      </div>
    </>
  );
}
