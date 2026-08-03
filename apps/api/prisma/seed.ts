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
