"use client";

import { useState } from "react";
import { AppNav } from "@/components/marketing/AppNav";
import { formatPKR } from "@/lib/price";

function monthlyInstallment(principal: number, annualRatePct: number, years: number) {
  const r = annualRatePct / 100 / 12;
  const n = years * 12;
  if (n <= 0) return 0;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

// The first entry in the Tools hub (platform blueprint §03/6) — the same
// nav slot the archive/listing calculators will grow into later (plot-size
// and unit converters, per §03/10).
function MortgageCalculator() {
  const [price, setPrice] = useState(10000000);
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [tenureYears, setTenureYears] = useState(20);
  const [interestRate, setInterestRate] = useState(15);

  const downPayment = price * (downPaymentPct / 100);
  const principal = price - downPayment;
  const monthly = monthlyInstallment(principal, interestRate, tenureYears);

  return (
    <div className="surface-flat p-5">
      <h2 className="font-display text-base font-bold text-ink">Home loan calculator</h2>
      <p className="mt-1 font-body text-xs text-ink-faint">
        A rough monthly installment estimate — not a loan offer. Check with your bank for actual rates.
      </p>

      <div className="mt-4 space-y-4">
        <label className="block">
          <span className="flex justify-between font-body text-xs font-semibold text-ink-soft">
            <span>Property price</span>
            <span>{formatPKR(price)}</span>
          </span>
          <input
            type="range"
            min={1000000}
            max={100000000}
            step={500000}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="mt-1 w-full"
          />
        </label>
        <label className="block">
          <span className="flex justify-between font-body text-xs font-semibold text-ink-soft">
            <span>Down payment</span>
            <span>{downPaymentPct}%</span>
          </span>
          <input
            type="range"
            min={10}
            max={50}
            step={5}
            value={downPaymentPct}
            onChange={(e) => setDownPaymentPct(Number(e.target.value))}
            className="mt-1 w-full"
          />
        </label>
        <label className="block">
          <span className="flex justify-between font-body text-xs font-semibold text-ink-soft">
            <span>Loan tenure</span>
            <span>{tenureYears} years</span>
          </span>
          <input
            type="range"
            min={5}
            max={25}
            step={5}
            value={tenureYears}
            onChange={(e) => setTenureYears(Number(e.target.value))}
            className="mt-1 w-full"
          />
        </label>
        <label className="block">
          <span className="flex justify-between font-body text-xs font-semibold text-ink-soft">
            <span>Interest rate</span>
            <span>{interestRate}% / yr</span>
          </span>
          <input
            type="range"
            min={5}
            max={25}
            step={0.5}
            value={interestRate}
            onChange={(e) => setInterestRate(Number(e.target.value))}
            className="mt-1 w-full"
          />
        </label>

        <div className="grid grid-cols-2 gap-4 border-t border-flat-border pt-4">
          <div>
            <p className="font-body text-xs text-ink-faint">Down payment</p>
            <p className="tabular font-display text-base font-bold text-ink">{formatPKR(downPayment)}</p>
          </div>
          <div>
            <p className="font-body text-xs text-ink-faint">Est. monthly installment</p>
            <p className="tabular font-display text-base font-bold text-teal">{formatPKR(monthly)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ToolsPage() {
  return (
    <>
      <div className="aurora-backdrop" />
      <div className="flex min-h-full flex-col">
        <div className="px-4 pt-4">
          <AppNav />
        </div>

        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-14">
          <h1 className="mb-2 font-display text-2xl font-extrabold text-ink">Tools</h1>
          <p className="mb-8 font-body text-sm text-ink-soft">
            Calculators and utilities to help you plan a purchase or rental.
          </p>

          <MortgageCalculator />

          <div className="surface-flat mt-4 p-5">
            <h2 className="font-display text-base font-bold text-ink">More on the way</h2>
            <p className="mt-1 font-body text-xs text-ink-faint">
              Plot Finder, an area-unit converter, and a construction cost calculator are next in this hub.
            </p>
          </div>
        </main>
      </div>
    </>
  );
}
