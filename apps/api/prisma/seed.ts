import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEV_PASSWORD = 'DevPass123!';

// Curated real-estate stock photography (Unsplash CDN, hotlink-stable URLs).
// The frontend gallery falls back to a placeholder on any load failure, so a
// stale/broken id here degrades gracefully rather than breaking the page.
const PHOTOS = {
  exteriorHouse: [
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1200&q=80',
  ],
  livingRoom: [
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80',
  ],
  kitchen: [
    'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?auto=format&fit=crop&w=1200&q=80',
  ],
  bedroom: [
    'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=1200&q=80',
  ],
  apartmentBuilding: [
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
  ],
  plot: ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80'],
  commercial: [
    'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80',
  ],
};

async function upsertUser(opts: {
  phone: string;
  name: string;
  role: 'CUSTOMER' | 'DEALER' | 'ADMIN';
  email: string;
}) {
  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 10);
  return prisma.user.upsert({
    where: { phone: opts.phone },
    update: {},
    create: {
      phone: opts.phone,
      name: opts.name,
      email: opts.email,
      role: opts.role,
      passwordHash,
      phoneVerifiedAt: new Date(),
      ...(opts.role === 'DEALER' ? { dealerProfile: { create: {} } } : {}),
    },
    include: { dealerProfile: true },
  });
}

interface SeedListing {
  id: string;
  ownerId: string;
  source: 'DEALER' | 'OWNER';
  purpose: 'SALE' | 'RENT';
  propertyType: 'HOUSE' | 'APARTMENT' | 'PLOT' | 'COMMERCIAL';
  title: string;
  description: string;
  price: number;
  city: string;
  area: string;
  // Structured location (§03/1) — optional, since not every seed listing
  // maps cleanly onto a named, phase-gated development. Where omitted,
  // `area` stays the only location data, same as a real unstructured entry.
  societyName?: string;
  phaseName?: string;
  beds?: number;
  baths?: number;
  sizeValue?: number;
  sizeUnit?: string;
  verified: boolean;
  photos: string[];
}

async function resolveSeedHierarchy(city: string, societyName?: string, phaseName?: string) {
  if (!societyName) return {};
  const society = await prisma.society.upsert({
    where: { city_name: { city, name: societyName } },
    update: {},
    create: { city, name: societyName },
  });
  if (!phaseName) return { societyId: society.id };
  const phase = await prisma.phase.upsert({
    where: { societyId_name: { societyId: society.id, name: phaseName } },
    update: {},
    create: { societyId: society.id, name: phaseName },
  });
  return { societyId: society.id, phaseId: phase.id };
}

async function upsertListing(dto: SeedListing) {
  const { societyId, phaseId } = await resolveSeedHierarchy(dto.city, dto.societyName, dto.phaseName);
  return prisma.listing.upsert({
    where: { id: dto.id },
    update: { societyId, phaseId },
    create: {
      id: dto.id,
      ownerId: dto.ownerId,
      source: dto.source,
      status: 'APPROVED',
      verified: dto.verified,
      purpose: dto.purpose,
      propertyType: dto.propertyType,
      title: dto.title,
      description: dto.description,
      price: dto.price,
      city: dto.city,
      area: dto.area,
      societyId,
      phaseId,
      beds: dto.beds,
      baths: dto.baths,
      sizeValue: dto.sizeValue,
      sizeUnit: dto.sizeUnit,
      photos: { create: dto.photos.map((url, order) => ({ url, order })) },
    },
  });
}

async function main() {
  console.log('Seeding dev data...');

  const admin = await upsertUser({
    phone: '+920000000001',
    name: 'Admin',
    role: 'ADMIN',
    email: 'admin@example.com',
  });

  const dealerA = await upsertUser({
    phone: '+920000000002',
    name: 'Ahmed — City Realty',
    role: 'DEALER',
    email: 'ahmed@example.com',
  });
  await prisma.dealerProfile.update({
    where: { userId: dealerA.id },
    data: {
      agencyName: 'City Realty',
      licenseNumber: 'LIC-1001',
      kycStatus: 'APPROVED',
      coverageCities: ['Lahore', 'Islamabad'],
      propertyTypes: ['HOUSE', 'APARTMENT', 'PLOT'],
    },
  });

  const dealerB = await upsertUser({
    phone: '+920000000003',
    name: 'Sara — Prime Homes',
    role: 'DEALER',
    email: 'sara@example.com',
  });
  await prisma.dealerProfile.update({
    where: { userId: dealerB.id },
    data: {
      agencyName: 'Prime Homes',
      licenseNumber: 'LIC-1002',
      kycStatus: 'APPROVED',
      coverageCities: ['Lahore', 'Karachi'],
      propertyTypes: ['HOUSE', 'APARTMENT', 'COMMERCIAL'],
    },
  });

  const dealerC = await upsertUser({
    phone: '+920000000005',
    name: 'Usman — Skyline Estates',
    role: 'DEALER',
    email: 'usman@example.com',
  });
  await prisma.dealerProfile.update({
    where: { userId: dealerC.id },
    data: {
      agencyName: 'Skyline Estates',
      licenseNumber: 'LIC-1003',
      kycStatus: 'APPROVED',
      coverageCities: ['Karachi', 'Islamabad'],
      propertyTypes: ['APARTMENT', 'COMMERCIAL', 'PLOT'],
    },
  });

  const customer = await upsertUser({
    phone: '+920000000004',
    name: 'Bilal Khan',
    role: 'CUSTOMER',
    email: 'bilal@example.com',
  });

  const listings = await Promise.all([
    upsertListing({
      id: 'seed-listing-1',
      ownerId: dealerA.id,
      source: 'DEALER',
      purpose: 'SALE',
      propertyType: 'HOUSE',
      title: '5 Marla, 3 bed corner plot',
      description:
        'Corner house on a west-facing plot, close to the park and main boulevard. Recently renovated kitchen and bathrooms, covered car porch, and a small front lawn — move-in ready.',
      price: 18500000,
      city: 'Lahore',
      area: 'Bahria Town, Phase 7',
      societyName: 'Bahria Town',
      phaseName: 'Phase 7',
      beds: 3,
      baths: 2,
      sizeValue: 5,
      sizeUnit: 'marla',
      verified: true,
      photos: [...PHOTOS.exteriorHouse.slice(0, 1), ...PHOTOS.livingRoom, ...PHOTOS.kitchen.slice(0, 1), ...PHOTOS.bedroom.slice(0, 1)],
    }),
    upsertListing({
      id: 'seed-listing-2',
      ownerId: dealerA.id,
      source: 'DEALER',
      purpose: 'SALE',
      propertyType: 'HOUSE',
      title: '1 Kanal, west-facing villa',
      description:
        'A spacious 1-kanal villa in DHA Phase 6 with a private garden, marble flooring throughout, and a dedicated servant quarter. Gated community with 24/7 security.',
      price: 32000000,
      city: 'Lahore',
      area: 'DHA Phase 6',
      societyName: 'DHA',
      phaseName: 'Phase 6',
      beds: 6,
      baths: 5,
      sizeValue: 1,
      sizeUnit: 'kanal',
      verified: true,
      photos: [PHOTOS.exteriorHouse[1], ...PHOTOS.livingRoom, ...PHOTOS.bedroom],
    }),
    upsertListing({
      id: 'seed-listing-3',
      ownerId: dealerB.id,
      source: 'DEALER',
      purpose: 'RENT',
      propertyType: 'APARTMENT',
      title: '2 bed apartment, Gulberg Greens',
      description:
        'Bright, modern 2-bed apartment on the 4th floor with an elevator, covered parking, and a rooftop community lounge. Walking distance to cafes and a grocery store.',
      price: 85000,
      city: 'Lahore',
      area: 'Gulberg Greens',
      societyName: 'Gulberg Greens',
      beds: 2,
      baths: 2,
      sizeValue: 1100,
      sizeUnit: 'sqft',
      verified: true,
      photos: [PHOTOS.apartmentBuilding[0], PHOTOS.livingRoom[0], PHOTOS.kitchen[0], PHOTOS.bedroom[0]],
    }),
    upsertListing({
      id: 'seed-listing-4',
      ownerId: dealerB.id,
      source: 'DEALER',
      purpose: 'SALE',
      propertyType: 'COMMERCIAL',
      title: 'Ground-floor shop, Main Boulevard',
      description:
        'High-footfall ground-floor commercial unit facing Main Boulevard Gulberg. Currently vacant, previously operated as a retail outlet — plumbing and electrical already fitted out.',
      price: 45000000,
      city: 'Lahore',
      area: 'Main Boulevard, Gulberg',
      sizeValue: 900,
      sizeUnit: 'sqft',
      verified: false,
      photos: PHOTOS.commercial,
    }),
    upsertListing({
      id: 'seed-listing-5',
      ownerId: dealerC.id,
      source: 'DEALER',
      purpose: 'SALE',
      propertyType: 'APARTMENT',
      title: '3 bed apartment, Clifton Block 5',
      description:
        'Sea-facing 3-bed apartment on a high floor with a wraparound balcony, two dedicated parking spots, and access to a shared pool and gym.',
      price: 42000000,
      city: 'Karachi',
      area: 'Clifton Block 5',
      beds: 3,
      baths: 3,
      sizeValue: 2100,
      sizeUnit: 'sqft',
      verified: true,
      photos: [PHOTOS.apartmentBuilding[1], PHOTOS.livingRoom[1], PHOTOS.bedroom[1]],
    }),
    upsertListing({
      id: 'seed-listing-6',
      ownerId: dealerC.id,
      source: 'DEALER',
      purpose: 'SALE',
      propertyType: 'PLOT',
      title: '10 Marla residential plot',
      description:
        'Corner residential plot in a fully developed sector with gas, electricity, and water connections already available on-site. Clear title, ready for immediate construction.',
      price: 9200000,
      city: 'Islamabad',
      area: 'DHA Phase 2',
      societyName: 'DHA',
      phaseName: 'Phase 2',
      sizeValue: 10,
      sizeUnit: 'marla',
      verified: false,
      photos: PHOTOS.plot,
    }),
    upsertListing({
      id: 'seed-listing-7',
      ownerId: dealerA.id,
      source: 'DEALER',
      purpose: 'RENT',
      propertyType: 'HOUSE',
      title: '4 bed house, F-8 Islamabad',
      description:
        'Well-maintained 4-bed house on a quiet street in F-8, with a large backyard, covered parking for two cars, and central heating throughout.',
      price: 150000,
      city: 'Islamabad',
      area: 'F-8',
      beds: 4,
      baths: 4,
      sizeValue: 1,
      sizeUnit: 'kanal',
      verified: true,
      photos: [PHOTOS.exteriorHouse[2], PHOTOS.kitchen[1], PHOTOS.bedroom[0]],
    }),
    upsertListing({
      id: 'seed-listing-8',
      ownerId: dealerB.id,
      source: 'OWNER',
      purpose: 'SALE',
      propertyType: 'HOUSE',
      title: '10 Marla house, owner listed',
      description:
        'Owner-listed, no dealer commission. Well-kept 10-marla house with 3 bedrooms, a small lawn, and a recently replaced roof. Serious buyers only.',
      price: 27500000,
      city: 'Lahore',
      area: 'Johar Town',
      beds: 3,
      baths: 3,
      sizeValue: 10,
      sizeUnit: 'marla',
      verified: false,
      photos: [PHOTOS.exteriorHouse[0], PHOTOS.livingRoom[0]],
    }),
  ]);

  // Promote a couple of listings so the promoTier badges, the homepage
  // featured rail, and the "promoted sorts first" archive behavior all have
  // something real to show in a demo instead of an all-STANDARD feed.
  async function promoteSeedListing(listingId: string, tier: 'FEATURED' | 'PREMIUM', purchasedById: string) {
    await prisma.listing.update({ where: { id: listingId }, data: { promoTier: tier } });
    await prisma.listingPromotion.upsert({
      where: { id: `seed-promo-${listingId}` },
      update: {},
      create: {
        id: `seed-promo-${listingId}`,
        listingId,
        tier,
        purchasedById,
        price: tier === 'PREMIUM' ? 15000 : 6000,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  }
  await promoteSeedListing('seed-listing-1', 'PREMIUM', dealerA.id);
  await promoteSeedListing('seed-listing-5', 'FEATURED', dealerC.id);

  // A couple of saved listings so /dashboard/favorites isn't empty on
  // first login.
  await prisma.favorite.upsert({
    where: { userId_listingId: { userId: customer.id, listingId: 'seed-listing-2' } },
    update: {},
    create: { userId: customer.id, listingId: 'seed-listing-2' },
  });
  await prisma.favorite.upsert({
    where: { userId_listingId: { userId: customer.id, listingId: 'seed-listing-6' } },
    update: {},
    create: { userId: customer.id, listingId: 'seed-listing-6' },
  });

  // News & Guides content (§14) — enough real, published articles across
  // all three categories to demo the archive/filter/single flow properly.
  interface SeedArticle {
    id: string;
    title: string;
    excerpt: string;
    body: string;
    category: 'NEWS' | 'GUIDE' | 'AREA_INSIGHT';
    tags: string[];
    coverImageUrl: string;
    daysAgo: number;
  }
  const articles: SeedArticle[] = [
    {
      id: 'seed-article-1',
      title: '5 Things to Check Before Buying a Plot in a Gated Society',
      excerpt: 'A quick pre-purchase checklist for plot buyers in Bahria Town, DHA, and similar developments.',
      body: `Buying a plot in a gated development is different from buying an already-built house — most of what you're checking is paperwork and development status, not bricks and mortar.

First, verify the NOC (no-objection certificate) status with the relevant development authority. A plot in a society without a valid NOC can sit in legal limbo for years.

Second, confirm the possession status of your specific phase or block — some phases in large societies are fully developed with utilities live, while others are still on paper years after launch.

Third, check for any pending utility or society maintenance dues tied to the plot itself, not just the seller — in most societies these transfer with the property.

Fourth, get the file transferred through the society's own transfer office, not just a private agreement — an un-transferred file is the single most common source of plot disputes.

Fifth, walk the actual plot boundaries with a society representative before you pay anything. Corner plots, park-facing plots, and plots on a society's boundary wall are frequently mis-marked on paper.`,
      category: 'GUIDE',
      tags: ['plots', 'buying-guide', 'gated-societies'],
      coverImageUrl: PHOTOS.plot[0],
      daysAgo: 2,
    },
    {
      id: 'seed-article-2',
      title: 'Lahore Rental Prices, Mid-2026: What Renters Are Actually Paying',
      excerpt: 'A snapshot of asking rents across Gulberg, DHA, Johar Town, and Bahria Town this quarter.',
      body: `Rental asking prices across Lahore's mid-tier neighborhoods have held roughly flat over the last two quarters, with the sharpest movement in 2-bed apartments near Gulberg Greens and Johar Town, where new supply from recently completed towers has kept rents from climbing further.

Houses in DHA phases 5 through 8 continue to command a premium over comparable homes in Bahria Town, largely on the back of established infrastructure and shorter commute times to the city center.

For renters working with a tight budget, the value pockets right now are 3-bed houses slightly off the main boulevards in Johar Town, and older-stock apartments in Gulberg that haven't been renovated since handover — often 15-20% below newer listings on the same street.

As always, these are asking prices from active listings, not closed transactions — actual agreed rents typically land 5-10% below what's first posted.`,
      category: 'NEWS',
      tags: ['lahore', 'rentals', 'market-update'],
      coverImageUrl: PHOTOS.apartmentBuilding[0],
      daysAgo: 5,
    },
    {
      id: 'seed-article-3',
      title: 'DHA Phase 6 vs. Bahria Town Phase 7: A Buyer’s Comparison',
      excerpt: 'Two of Lahore’s most-searched developments, compared on infrastructure, price bands, and commute.',
      body: `DHA Phase 6 and Bahria Town Phase 7 are two of the most frequently cross-shopped developments among buyers looking in Lahore's PKR 2-4 crore range for a plot or built house, and the two areas trade off on different strengths.

DHA Phase 6 is more built-out, with mature infrastructure, established commercial areas, and shorter commute times to central Lahore — buyers pay a premium for this maturity, and inventory tends to be built houses rather than vacant plots.

Bahria Town Phase 7 sits further out but offers larger plot sizes at a lower per-marla rate, along with newer, more consistently planned infrastructure since it's a more recently developed phase. It suits buyers prioritizing space and a fresh build over proximity.

For a family prioritizing schools and daily commute, DHA Phase 6 is usually the better fit despite the premium. For a buyer building from scratch on a larger footprint, Bahria Town Phase 7 offers more plot for the same budget.`,
      category: 'AREA_INSIGHT',
      tags: ['dha', 'bahria-town', 'lahore', 'comparison'],
      coverImageUrl: PHOTOS.exteriorHouse[1],
      daysAgo: 9,
    },
    {
      id: 'seed-article-4',
      title: 'How Manzil’s Requirement Matching Actually Works',
      excerpt: 'Post once, and every dealer covering your city and property type sees it — here’s the mechanic behind it.',
      body: `Instead of scrolling every listing hoping to find a match, Manzil lets you post what you're looking for once — city, property type, purpose, budget range, and any notes — and it goes out to every verified dealer covering that city and property type at the same time.

The first dealer to accept gets a 6-hour window to make contact and log a status update. If they go quiet, the requirement automatically re-opens for another dealer to pick up — so a slow response doesn't leave you waiting indefinitely with no one working your search.

Every status update a dealer logs is visible on your requirement's timeline, and the whole conversation happens over Manzil's in-app chat, which keeps a record in case anything needs to be referenced later.

This works especially well for specific or hard-to-find requirements — a particular phase, a specific budget band, a plot size that doesn't come up often — where actively having dealers looking on your behalf beats passively scrolling a search page.`,
      category: 'GUIDE',
      tags: ['how-it-works', 'requirements', 'dealers'],
      coverImageUrl: PHOTOS.livingRoom[0],
      daysAgo: 14,
    },
    {
      id: 'seed-article-5',
      title: 'Karachi’s Clifton and DHA Corridors: Where Apartment Prices Are Headed',
      excerpt: 'A look at price movement in Karachi’s most established high-rise corridors.',
      body: `Apartment prices in Clifton and Karachi's DHA phases have shown steady, if unspectacular, appreciation over the past year, with sea-facing units in older, established buildings continuing to outperform newer inland towers on a per-square-foot basis.

The premium for sea-facing units has actually widened slightly, as buyers increasingly treat that view as a scarce, non-repeatable feature rather than a nice-to-have — a trend distinct from most other Pakistani cities, where floor level matters more than orientation.

New supply from recently launched towers in DHA's outer phases has kept prices for inland, newer-build units relatively flat, giving buyers more negotiating room there than in Clifton's more constrained, largely built-out corridor.

For buyers prioritizing long-term value retention over immediate move-in condition, an older sea-facing unit in Clifton has historically held its value better than a newer inland unit at a similar price point.`,
      category: 'AREA_INSIGHT',
      tags: ['karachi', 'clifton', 'dha', 'apartments'],
      coverImageUrl: PHOTOS.apartmentBuilding[1],
      daysAgo: 20,
    },
    {
      id: 'seed-article-6',
      title: 'Never Send Money Before Signing an Agreement — A Refresher',
      excerpt: 'The single most common way property deals go wrong, and how to avoid it.',
      body: `It comes up on every trust-and-safety list for a reason: the most common way a property transaction goes wrong isn't a forged title or a fake listing — it's a buyer sending a token or advance payment before anything is in writing.

A verbal agreement, even with a dealer you've spoken to several times over chat, is not a substitute for a written agreement specifying the property, the price, the payment schedule, and what happens if either side backs out.

If a dealer or seller pushes for payment before a written agreement is ready, treat that as a signal to slow down, not speed up — a legitimate seller has no reason to skip this step.

Keep the conversation on Manzil's in-app chat until an agreement is signed. It keeps a timestamped record of what was discussed and agreed, which matters if there's ever a dispute later.`,
      category: 'GUIDE',
      tags: ['safety', 'buying-guide'],
      coverImageUrl: PHOTOS.exteriorHouse[0],
      daysAgo: 25,
    },
  ];
  for (const a of articles) {
    const publishedAt = new Date(Date.now() - a.daysAgo * 24 * 60 * 60 * 1000);
    await prisma.article.upsert({
      where: { id: a.id },
      update: {},
      create: {
        id: a.id,
        title: a.title,
        slug: a.id.replace('seed-', ''),
        excerpt: a.excerpt,
        body: a.body,
        coverImageUrl: a.coverImageUrl,
        category: a.category,
        tags: a.tags,
        status: 'PUBLISHED',
        publishedAt,
        authorId: admin.id,
        metaTitle: a.title,
        metaDescription: a.excerpt,
      },
    });
  }

  // Reviews so dealer ratings reflect more than a single data point.
  await prisma.review.upsert({
    where: { id: 'seed-review-1' },
    update: {},
    create: {
      id: 'seed-review-1',
      dealerId: dealerA.id,
      customerId: customer.id,
      rating: 5,
      comment: 'Ahmed was quick to respond and followed through until closing. Highly recommend.',
    },
  });
  await prisma.review.upsert({
    where: { id: 'seed-review-2' },
    update: {},
    create: {
      id: 'seed-review-2',
      dealerId: dealerB.id,
      customerId: customer.id,
      rating: 4,
      comment: 'Good communication throughout, a bit slow on paperwork but got there.',
    },
  });
  const [ratingA, ratingB] = await Promise.all([
    prisma.review.aggregate({ where: { dealerId: dealerA.id }, _avg: { rating: true }, _count: true }),
    prisma.review.aggregate({ where: { dealerId: dealerB.id }, _avg: { rating: true }, _count: true }),
  ]);
  await prisma.dealerProfile.update({
    where: { userId: dealerA.id },
    data: { ratingAvg: ratingA._avg.rating ?? 0, ratingCount: ratingA._count },
  });
  await prisma.dealerProfile.update({
    where: { userId: dealerB.id },
    data: { ratingAvg: ratingB._avg.rating ?? 0, ratingCount: ratingB._count },
  });

  console.log({
    admin: { phone: admin.phone, password: DEV_PASSWORD },
    dealerA: { phone: dealerA.phone, password: DEV_PASSWORD },
    dealerB: { phone: dealerB.phone, password: DEV_PASSWORD },
    dealerC: { phone: dealerC.phone, password: DEV_PASSWORD },
    customer: { phone: customer.phone, password: DEV_PASSWORD },
    listings: listings.map((l) => l.id),
  });
  console.log('Seed complete.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
