import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEV_PASSWORD = 'DevPass123!';

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
      coverageCities: ['Lahore'],
      propertyTypes: ['HOUSE', 'APARTMENT'],
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
      coverageCities: ['Lahore'],
      propertyTypes: ['HOUSE', 'APARTMENT'],
    },
  });

  const customer = await upsertUser({
    phone: '+920000000004',
    name: 'Bilal Khan',
    role: 'CUSTOMER',
    email: 'bilal@example.com',
  });

  const listing = await prisma.listing.upsert({
    where: { id: 'seed-listing-1' },
    update: {},
    create: {
      id: 'seed-listing-1',
      ownerId: dealerA.id,
      source: 'DEALER',
      status: 'APPROVED',
      verified: true,
      purpose: 'SALE',
      propertyType: 'HOUSE',
      title: '5 Marla, 3 bed corner plot',
      description: 'Corner plot, west-facing, close to park and main boulevard.',
      price: 18500000,
      city: 'Lahore',
      area: 'Bahria Town, Phase 7',
      beds: 3,
      baths: 2,
      sizeValue: 5,
      sizeUnit: 'marla',
      photos: { create: [{ url: 'https://picsum.photos/seed/listing1/640/480', order: 0 }] },
    },
  });

  console.log({
    admin: { phone: admin.phone, password: DEV_PASSWORD },
    dealerA: { phone: dealerA.phone, password: DEV_PASSWORD },
    dealerB: { phone: dealerB.phone, password: DEV_PASSWORD },
    customer: { phone: customer.phone, password: DEV_PASSWORD },
    listing: listing.id,
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
