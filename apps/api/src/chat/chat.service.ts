import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { detectFlag } from './flag-detector';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  listMine(userId: string) {
    return this.prisma.conversation.findMany({
      where: { participants: { some: { userId } } },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true, role: true } } },
        },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        lead: { include: { requirement: true } },
        listing: { select: { id: true, title: true } },
        lease: { include: { unit: { select: { id: true, title: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMessages(
    conversationId: string,
    requesterId: string,
    isAdmin = false,
  ) {
    if (!isAdmin) await this.assertParticipant(conversationId, requesterId);

    return this.prisma.message.findMany({
      where: { conversationId },
      include: { sender: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'asc' },
      take: 500,
    });
  }

  async sendMessage(conversationId: string, senderId: string, body: string) {
    await this.assertParticipant(conversationId, senderId);
    const { flagged, reason } = detectFlag(body);

    return this.prisma.message.create({
      data: { conversationId, senderId, body, flagged, flagReason: reason },
      include: { sender: { select: { id: true, name: true, role: true } } },
    });
  }

  // -- admin (trust & safety) ------------------------------------------------

  adminListConversations() {
    return this.prisma.conversation.findMany({
      include: {
        participants: {
          include: { user: { select: { id: true, name: true, role: true } } },
        },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count: { select: { messages: { where: { flagged: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  flaggedQueue() {
    return this.prisma.message.findMany({
      where: { flagged: true },
      include: {
        sender: { select: { id: true, name: true, role: true } },
        conversation: { select: { id: true, leadId: true, listingId: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  private async assertParticipant(conversationId: string, userId: string) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!participant)
      throw new ForbiddenException('Not a participant in this conversation');
  }
}
