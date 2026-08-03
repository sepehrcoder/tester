import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { SearchListingsDto } from './dto/search-listings.dto';
import { LocationsService } from '../locations/locations.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import type { ListingStatus } from '../../generated/prisma/enums';

// Flat per-tier day rate, PKR — the simplest self-serve promotion model
// from the platform blueprint (§15): a fixed price for a fixed window,
// auto-reverting to STANDARD on expiry. No plans, no billing cycles.
const PROMO_DAILY_RATE: Record<'FEATURED' | 'PREMIUM', number> = {
  FEATURED: 200,
  PREMIUM: 500,
};

@Injectable()
export class ListingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly locations: LocationsService,
  ) {}

  async create(user: AuthenticatedUser, dto: CreateListingDto) {
    const { photoUrls, societyName, phaseName, blockName, ...rest } = dto;
    const hierarchy = await this.locations.resolveHierarchy(dto.city, societyName, phaseName, blockName);
    return this.prisma.listing.create({
      data: {
        ...rest,
        ...(hierarchy.area ? { area: hierarchy.area } : {}),
        societyId: hierarchy.societyId,
        phaseId: hierarchy.phaseId,
        blockId: hierarchy.blockId,
        ownerId: user.id,
        source: user.role === 'DEALER' ? 'DEALER' : 'OWNER',
        photos: photoUrls?.length
          ? { create: photoUrls.map((url, order) => ({ url, order })) }
          : undefined,
      },
      include: { photos: true },
    });
  }

  // Public homepage trust-strip numbers (§02/§06 of the platform blueprint) —
  // deliberately cheap, coarse counts, not a full admin analytics query.
  async stats() {
    const [totalListings, verifiedDealers, cities] = await Promise.all([
      this.prisma.listing.count({ where: { status: 'APPROVED' } }),
      this.prisma.dealerProfile.count({ where: { kycStatus: 'APPROVED' } }),
      this.prisma.listing.findMany({
        where: { status: 'APPROVED' },
        distinct: ['city'],
        select: { city: true },
      }),
    ]);
    return { totalListings, verifiedDealers, cities: cities.length };
  }

  // "Browse by area" widget (§03/4 of the platform blueprint) — live counts
  // per area within a city, grouped on the existing free-text area field
  // (the Society/Phase/Block hierarchy this will eventually key off doesn't
  // exist yet).
  async areaCounts(city: string) {
    const grouped = await this.prisma.listing.groupBy({
      by: ['area'],
      where: { status: 'APPROVED', city: { equals: city, mode: 'insensitive' } },
      _count: { _all: true },
      orderBy: { area: 'asc' },
    });
    return grouped
      .map((g) => ({ area: g.area, count: g._count._all }))
      .sort((a, b) => b.count - a.count);
  }

  async search(query: SearchListingsDto) {
    const where = {
      status: 'APPROVED' as ListingStatus,
      ...(query.city
        ? { city: { equals: query.city, mode: 'insensitive' as const } }
        : {}),
      ...(query.phaseId ? { phaseId: query.phaseId } : {}),
      ...(query.purpose ? { purpose: query.purpose } : {}),
      ...(query.propertyType ? { propertyType: query.propertyType } : {}),
      ...(query.beds ? { beds: { gte: query.beds } } : {}),
      ...(query.verifiedOnly ? { verified: true } : {}),
      ...(query.minPrice || query.maxPrice
        ? {
            price: {
              ...(query.minPrice ? { gte: query.minPrice } : {}),
              ...(query.maxPrice ? { lte: query.maxPrice } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.listing.findMany({
        where,
        include: {
          photos: { orderBy: { order: 'asc' }, take: 1 },
          owner: { select: { phone: true } },
        },
        // promoTier desc relies on Postgres enum declaration order
        // (STANDARD < FEATURED < PREMIUM) to rank paid placements first.
        orderBy: [{ promoTier: 'desc' }, { createdAt: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.listing.count({ where }),
    ]);

    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async findOne(id: string, requester?: AuthenticatedUser) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: {
        photos: { orderBy: { order: 'asc' } },
        society: { select: { name: true } },
        phase: { select: { name: true } },
        block: { select: { name: true } },
        owner: {
          select: {
            id: true,
            name: true,
            role: true,
            avatarUrl: true,
            createdAt: true,
            phone: true,
            dealerProfile: {
              select: {
                agencyName: true,
                ratingAvg: true,
                ratingCount: true,
                kycStatus: true,
              },
            },
          },
        },
      },
    });
    if (!listing) throw new NotFoundException('Listing not found');

    const isOwnerOrAdmin =
      requester &&
      (requester.id === listing.ownerId || requester.role === 'ADMIN');
    if (listing.status !== 'APPROVED' && !isOwnerOrAdmin) {
      throw new NotFoundException('Listing not found');
    }
    return listing;
  }

  findMine(userId: string) {
    return this.prisma.listing.findMany({
      where: { ownerId: userId },
      include: { photos: { orderBy: { order: 'asc' }, take: 1 } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdateListingDto) {
    const listing = await this.assertOwnerOrAdmin(user, id);
    const { societyName, phaseName, blockName, ...rest } = dto;
    const hierarchy = societyName
      ? await this.locations.resolveHierarchy(dto.city ?? listing.city, societyName, phaseName, blockName)
      : {};
    return this.prisma.listing.update({
      where: { id },
      data: {
        ...rest,
        ...(hierarchy.area ? { area: hierarchy.area } : {}),
        ...(hierarchy.societyId ? { societyId: hierarchy.societyId } : {}),
        ...(hierarchy.phaseId ? { phaseId: hierarchy.phaseId } : {}),
        ...(hierarchy.blockId ? { blockId: hierarchy.blockId } : {}),
      },
    });
  }

  async remove(user: AuthenticatedUser, id: string) {
    await this.assertOwnerOrAdmin(user, id);
    await this.prisma.listing.delete({ where: { id } });
    return { id };
  }

  async addPhoto(user: AuthenticatedUser, id: string, url: string) {
    await this.assertOwnerOrAdmin(user, id);
    const count = await this.prisma.listingPhoto.count({
      where: { listingId: id },
    });
    return this.prisma.listingPhoto.create({
      data: { listingId: id, url, order: count },
    });
  }

  /** Buyer-initiated chat about a listing — one conversation per (listing, buyer) pair, since many buyers can be interested in the same listing. */
  async openChat(user: AuthenticatedUser, id: string) {
    const listing = await this.findOne(id, user);
    if (listing.ownerId === user.id) {
      throw new ForbiddenException(
        "You can't message yourself about your own listing",
      );
    }

    const existing = await this.prisma.conversation.findFirst({
      where: { listingId: id, participants: { some: { userId: user.id } } },
    });
    if (existing) return existing;

    return this.prisma.conversation.create({
      data: {
        listingId: id,
        participants: {
          create: [{ userId: user.id }, { userId: listing.ownerId }],
        },
      },
    });
  }

  /** Used by AdminService — not exposed directly on this controller. */
  setStatus(id: string, status: ListingStatus, verified?: boolean) {
    return this.prisma.listing.update({
      where: { id },
      data: { status, ...(verified !== undefined ? { verified } : {}) },
    });
  }

  // -- promotion (§15 of the platform blueprint) ----------------------------

  async promote(
    id: string,
    tier: 'FEATURED' | 'PREMIUM',
    days: number,
    purchasedBy: AuthenticatedUser,
  ) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Listing not found');

    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const price = PROMO_DAILY_RATE[tier] * days;

    const [, updated] = await this.prisma.$transaction([
      this.prisma.listingPromotion.create({
        data: { listingId: id, tier, price, expiresAt, purchasedById: purchasedBy.id },
      }),
      this.prisma.listing.update({
        where: { id },
        data: { promoTier: tier },
      }),
    ]);
    return updated;
  }

  async unpromote(id: string) {
    return this.prisma.listing.update({
      where: { id },
      data: { promoTier: 'STANDARD' },
    });
  }

  /** Reverts any listing whose paid promotion window has passed back to STANDARD. */
  async releaseExpiredPromotions(): Promise<number> {
    const expired = await this.prisma.listing.findMany({
      where: {
        promoTier: { not: 'STANDARD' },
        promotions: { some: { expiresAt: { lt: new Date() } } },
      },
      select: { id: true },
    });
    if (expired.length === 0) return 0;

    await this.prisma.listing.updateMany({
      where: { id: { in: expired.map((l) => l.id) } },
      data: { promoTier: 'STANDARD' },
    });
    return expired.length;
  }

  private async assertOwnerOrAdmin(user: AuthenticatedUser, listingId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.ownerId !== user.id && user.role !== 'ADMIN') {
      throw new ForbiddenException('Not your listing');
    }
    return listing;
  }
}
