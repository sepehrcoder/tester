# Real Estate Marketplace

Three-way real estate marketplace (Customer, Dealer, Admin) — web app, mobile app, and a shared design system.

## Structure

```
apps/
  web/      Next.js website (customer + dealer web experience)
  mobile/   Expo (React Native) app (customer + dealer mobile experience)
packages/
  theme/    Single source of truth for the "Aurora Glass" design tokens
  icons/    Shared icon set (lucide-based) used identically on web and mobile
```

## Design system

The visual identity is **Aurora Glass**: a near-black flagship dark theme with a
drifting violet/cyan/ember gradient backdrop, frosted glass surfaces with a
crisp light-catching edge, and a strict rule about *where* glass is allowed —
see `packages/theme/src/tokens.ts` for the full rationale and values.

Fonts: **Bricolage Grotesque** (display/headings) + **Manrope** (body/UI),
both variable, both self-hosted — no third-party font requests at runtime.

## Getting started

```bash
npm install

# web
npm run dev:web

# mobile (Expo)
npm run dev:mobile
```
