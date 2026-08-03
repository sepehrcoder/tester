import { AppNav } from "@/components/marketing/AppNav";

export default function ContactPage() {
  return (
    <>
      <div className="aurora-backdrop" />
      <div className="flex min-h-full flex-col">
        <div className="px-4 pt-4">
          <AppNav />
        </div>

        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-14">
          <h1 className="font-display text-3xl font-extrabold text-ink">Contact us</h1>
          <p className="mt-4 font-body text-base text-ink-soft">
            Questions about a listing, a dealer account, or something that doesn&apos;t look right? Reach out —
            we typically respond within one business day.
          </p>
          <div className="surface-flat mt-6 p-5">
            <p className="font-body text-sm text-ink-faint">Email</p>
            <a href="mailto:support@manzil.app" className="font-body text-base font-semibold text-teal">
              support@manzil.app
            </a>
            <p className="mt-4 font-body text-sm text-ink-faint">Phone</p>
            <p className="font-body text-base font-semibold text-ink">+92 300 000 0000</p>
          </div>
        </main>
      </div>
    </>
  );
}
