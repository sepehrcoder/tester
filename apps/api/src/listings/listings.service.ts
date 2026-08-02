import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { SearchListingsDto } from './dto/search-listings.dto';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import type { ListingStatus } from '../../generated/prisma/enums';

@Injectable()
export class ListingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: AuthenticatedUser, dto: CreateListingDto) {
    const { photoUrls, ...rest } = dto;
    return this.prisma.listing.create({
      data: {
        ...rest,
        ownerId: user.id,
        source: user.role === 'DEALER' ? 'DEALER' : 'OWNER',
        photos: photoUrls?.length
          ? { create: photoUrls.map((url, order) => ({ url, order })) }
          : undefined,
      },
      include: { photos: true },
    });
  }

  async search(query: SearchListingsDto) {
    const where = {
      status: 'APPROVED' as ListingStatus,
      ...(query.city
        ? { city: { equals: query.city, mode: 'insensitive' as const } }
        : {}),
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
        include: { photos: { orderBy: { order: 'asc' }, take: 1 } },
        orderBy: { createdAt: 'desc' },
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
        owner: {
          select: {
            id: true,
            name: true,
            role: true,
            avatarUrl: true,
            createdAt: true,
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
    await this.assertOwnerOrAdmin(user, id);
    return this.prisma.listing.update({ where: { id }, data: dto });
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
