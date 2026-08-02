import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(customer: AuthenticatedUser, dto: CreateReviewDto) {
    const lead = await this.prisma.lead.findUnique({
      where: { id: dto.leadId },
      include: { requirement: true },
    });
    if (!lead) throw new NotFoundException('Lead not found');
    if (lead.requirement.customerId !== customer.id)
      throw new ForbiddenException('Not your lead');
    if (lead.dealerId !== dto.dealerId)
      throw new BadRequestException('This dealer did not work this lead');
    if (lead.status !== 'CLOSED_WON' && lead.status !== 'CLOSED_LOST') {
      throw new BadRequestException('This lead has not been closed yet');
    }

    const review = await this.prisma.review.create({
      data: {
        dealerId: dto.dealerId,
        customerId: customer.id,
        leadId: dto.leadId,
        rating: dto.rating,
        comment: dto.comment,
      },
    });

    await this.recomputeDealerRating(dto.dealerId);
    return review;
  }

  forDealer(dealerId: string) {
    return this.prisma.review.findMany({
      where: { dealerId },
      include: { customer: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async recomputeDealerRating(dealerId: string) {
    const agg = await this.prisma.review.aggregate({
      where: { dealerId },
      _avg: { rating: true },
      _count: true,
    });
    await this.prisma.dealerProfile.update({
      where: { userId: dealerId },
      data: { ratingAvg: agg._avg.rating ?? 0, ratingCount: agg._count },
    });
  }
}
