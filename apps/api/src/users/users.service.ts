import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateDealerProfileDto } from './dto/update-dealer-profile.dto';
import { SubmitKycDto } from './dto/submit-kyc.dto';
import { SearchDealersDto } from './dto/search-dealers.dto';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      omit: { passwordHash: true },
    });
  }

  async updateDealerProfile(userId: string, dto: UpdateDealerProfileDto) {
    await this.assertDealerProfile(userId);
    return this.prisma.dealerProfile.update({
      where: { userId },
      data: dto,
    });
  }

  async submitKyc(userId: string, dto: SubmitKycDto) {
    await this.assertDealerProfile(userId);
    return this.prisma.dealerProfile.update({
      where: { userId },
      data: { kycDocumentUrl: dto.documentUrl, kycStatus: 'PENDING' },
    });
  }

  async joinCompany(userId: string, inviteCode: string) {
    await this.assertDealerProfile(userId);
    const company = await this.prisma.company.findUnique({
      where: { inviteCode },
    });
    if (!company) throw new NotFoundException('Invalid invite code');
    return this.prisma.dealerProfile.update({
      where: { userId },
      data: { companyId: company.id },
      include: { company: { select: { id: true, name: true } } },
    });
  }

  async leaveCompany(userId: string) {
    await this.assertDealerProfile(userId);
    return this.prisma.dealerProfile.update({
      where: { userId },
      data: { companyId: null },
    });
  }

  async myStats(user: AuthenticatedUser) {
    if (user.role === 'DEALER') return this.dealerStats(user.id);
    return this.customerStats(user.id);
  }

  private async customerStats(customerId: string) {
    const [requirementCounts, listingCounts, leadsInProgress] =
      await Promise.all([
        this.prisma.requirement.groupBy({
          by: ['status'],
          where: { customerId },
          _count: true,
        }),
        this.prisma.listing.groupBy({
          by: ['status'],
          where: { ownerId: customerId },
          _count: true,
        }),
        this.prisma.lead.count({
          where: { requirement: { customerId }, status: 'ACCEPTED' },
        }),
      ]);

    const requirements = { OPEN: 0, CLOSED: 0, CANCELLED: 0 } as Record<
      string,
      number
    >;
    for (const row of requirementCounts) requirements[row.status] = row._count;

    const listings = {
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
      FLAGGED: 0,
      ARCHIVED: 0,
    } as Record<string, number>;
    for (const row of listingCounts) listings[row.status] = row._count;

    return { requirements, listings, leadsInProgress };
  }

  private async dealerStats(dealerId: string) {
    const [assignmentCounts, activeLeads, listingCounts, profile] =
      await Promise.all([
        this.prisma.leadAssignment.groupBy({
          by: ['outcome'],
          where: { dealerId },
          _count: true,
        }),
        this.prisma.lead.count({ where: { dealerId, status: 'ACCEPTED' } }),
        this.prisma.listing.groupBy({
          by: ['status'],
          where: { ownerId: dealerId },
          _count: true,
        }),
        this.prisma.dealerProfile.findUnique({
          where: { userId: dealerId },
          select: {
            ratingAvg: true,
            ratingCount: true,
            kycStatus: true,
            companyId: true,
            company: { select: { id: true, name: true } },
          },
        }),
      ]);

    let closedWon = 0;
    let closedLost = 0;
    let releasedSla = 0;
    let totalAccepted = 0;
    for (const row of assignmentCounts) {
      totalAccepted += row._count;
      if (row.outcome === 'CLOSED_WON') closedWon = row._count;
      if (row.outcome === 'CLOSED_LOST') closedLost = row._count;
      if (row.outcome === 'RELEASED_SLA') releasedSla = row._count;
    }
    const closedTotal = closedWon + closedLost;
    const conversionRate = closedTotal > 0 ? closedWon / closedTotal : 0;

    const listings = {
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
      FLAGGED: 0,
      ARCHIVED: 0,
    } as Record<string, number>;
    for (const row of listingCounts) listings[row.status] = row._count;

    return {
      totalAccepted,
      activeLeads,
      closedWon,
      closedLost,
      releasedSla,
      conversionRate,
      listings,
      ratingAvg: profile?.ratingAvg ?? 0,
      ratingCount: profile?.ratingCount ?? 0,
      kycStatus: profile?.kycStatus ?? 'UNSUBMITTED',
      company: profile?.company ?? null,
    };
  }

  /** Public dealer directory — approved-KYC dealers only, optionally filtered by coverage. */
  listPublicDealers(query: SearchDealersDto) {
    return this.prisma.dealerProfile.findMany({
      where: {
        kycStatus: 'APPROVED',
        ...(query.city ? { coverageCities: { has: query.city } } : {}),
        ...(query.propertyType
          ? { propertyTypes: { has: query.propertyType } }
          : {}),
      },
      select: {
        userId: true,
        agencyName: true,
        coverageCities: true,
        propertyTypes: true,
        ratingAvg: true,
        ratingCount: true,
        user: { select: { name: true, avatarUrl: true } },
      },
      orderBy: { ratingAvg: 'desc' },
      take: 100,
    });
  }

  async getPublicDealerProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, role: 'DEALER' },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
        dealerProfile: {
          select: {
            agencyName: true,
            kycStatus: true,
            coverageCities: true,
            propertyTypes: true,
            ratingAvg: true,
            ratingCount: true,
          },
        },
      },
    });
    if (!user) throw new NotFoundException('Dealer not found');
    return user;
  }

  private async assertDealerProfile(userId: string) {
    const profile = await this.prisma.dealerProfile.findUnique({
      where: { userId },
    });
    if (!profile)
      throw new BadRequestException('This account has no dealer profile');
    return profile;
  }
}
