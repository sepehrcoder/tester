import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Prisma } from '../../generated/prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  create(
    userId: string,
    type: string,
    title: string,
    body: string,
    meta?: Prisma.InputJsonValue,
  ) {
    return this.prisma.notification.create({
      data: { userId, type, title, body, meta },
    });
  }

  createMany(
    userIds: string[],
    type: string,
    title: string,
    body: string,
    meta?: Prisma.InputJsonValue,
  ) {
    if (userIds.length === 0) return Promise.resolve({ count: 0 });
    return this.prisma.notification.createMany({
      data: userIds.map((userId) => ({ userId, type, title, body, meta })),
    });
  }

  listMine(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async markRead(userId: string, id: string) {
    await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { readAt: new Date() },
    });
    return { id };
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { ok: true };
  }
}
