import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// "My saved listings" (§04/§12 of the platform blueprint, Phase 4).
@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async add(userId: string, listingId: string) {
    await this.prisma.favorite.upsert({
      where: { userId_listingId: { userId, listingId } },
      update: {},
      create: { userId, listingId },
    });
    return { favorited: true };
  }

  async remove(userId: string, listingId: string) {
    await this.prisma.favorite.deleteMany({ where: { userId, listingId } });
    return { favorited: false };
  }

  listMine(userId: string) {
    return this.prisma.favorite.findMany({
      where: { userId },
      include: {
        listing: {
          include: { photos: { orderBy: { order: 'asc' }, take: 1 } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listMyIds(userId: string) {
    const rows = await this.prisma.favorite.findMany({
      where: { userId },
      select: { listingId: true },
    });
    return rows.map((r) => r.listingId);
  }
}
