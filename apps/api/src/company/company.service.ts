import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompanyService {
  constructor(private readonly prisma: PrismaService) {}

  async me(ownerId: string) {
    const company = await this.getOwnedCompany(ownerId);
    const dealerCount = await this.prisma.dealerProfile.count({
      where: { companyId: company.id },
    });
    return { ...company, dealerCount };
  }

  async overview(ownerId: string) {
    const company = await this.getOwnedCompany(ownerId);
    const dealerIds = await this.dealerUserIds(company.id);

    if (dealerIds.length === 0) {
      return {
        dealerCount: 0,
        activeLeads: 0,
        totalAccepted: 0,
        closedWon: 0,
        closedLost: 0,
        conversionRate: 0,
        totalListings: 0,
        avgRating: 0,
      };
    }

    const [assignmentCounts, activeLeads, listingCount, ratings] =
      await Promise.all([
        this.prisma.leadAssignment.groupBy({
          by: ['outcome'],
          where: { dealerId: { in: dealerIds } },
          _count: true,
        }),
        this.prisma.lead.count({
          where: { dealerId: { in: dealerIds }, status: 'ACCEPTED' },
        }),
        this.prisma.listing.count({ where: { ownerId: { in: dealerIds } } }),
        this.prisma.dealerProfile.aggregate({
          where: { companyId: company.id },
          _avg: { ratingAvg: true },
        }),
      ]);

    let totalAccepted = 0;
    let closedWon = 0;
    let closedLost = 0;
    for (const row of assignmentCounts) {
      totalAccepted += row._count;
      if (row.outcome === 'CLOSED_WON') closedWon = row._count;
      if (row.outcome === 'CLOSED_LOST') closedLost = row._count;
    }
    const closedTotal = closedWon + closedLost;

    return {
      dealerCount: dealerIds.length,
      activeLeads,
      totalAccepted,
      closedWon,
      closedLost,
      conversionRate: closedTotal > 0 ? closedWon / closedTotal : 0,
      totalListings: listingCount,
      avgRating: ratings._avg.ratingAvg ?? 0,
    };
  }

  async dealers(ownerId: string) {
    const company = await this.getOwnedCompany(ownerId);
    const profiles = await this.prisma.dealerProfile.findMany({
      where: { companyId: company.id },
      include: {
        user: {
          select: { id: true, name: true, phone: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (profiles.length === 0) return [];

    const dealerIds = profiles.map((p) => p.userId);
    const [assignmentCounts, activeByDealer, listingsByDealer] =
      await Promise.all([
        this.prisma.leadAssignment.groupBy({
          by: ['dealerId', 'outcome'],
          where: { dealerId: { in: dealerIds } },
          _count: true,
        }),
        this.prisma.lead.groupBy({
          by: ['dealerId'],
          where: { dealerId: { in: dealerIds }, status: 'ACCEPTED' },
          _count: true,
        }),
        this.prisma.listing.groupBy({
          by: ['ownerId'],
          where: { ownerId: { in: dealerIds } },
          _count: true,
        }),
      ]);

    const activeMap = new Map(
      activeByDealer.map((r) => [r.dealerId, r._count]),
    );
    const listingMap = new Map(
      listingsByDealer.map((r) => [r.ownerId, r._count]),
    );

    return profiles.map((profile) => {
      const rows = assignmentCounts.filter(
        (r) => r.dealerId === profile.userId,
      );
      let totalAccepted = 0;
      let closedWon = 0;
      let closedLost = 0;
      for (const row of rows) {
        totalAccepted += row._count;
        if (row.outcome === 'CLOSED_WON') closedWon = row._count;
        if (row.outcome === 'CLOSED_LOST') closedLost = row._count;
      }
      const closedTotal = closedWon + closedLost;
      return {
        id: profile.userId,
        name: profile.user.name,
        phone: profile.user.phone,
        agencyName: profile.agencyName,
        kycStatus: profile.kycStatus,
        ratingAvg: profile.ratingAvg,
        ratingCount: profile.ratingCount,
        joinedCompanyAt: profile.updatedAt,
        activeLeads: activeMap.get(profile.userId) ?? 0,
        totalAccepted,
        closedWon,
        closedLost,
        conversionRate: closedTotal > 0 ? closedWon / closedTotal : 0,
        listingCount: listingMap.get(profile.userId) ?? 0,
      };
    });
  }

  async dealerDetail(ownerId: string, dealerId: string) {
    const company = await this.getOwnedCompany(ownerId);
    const profile = await this.prisma.dealerProfile.findUnique({
      where: { userId: dealerId },
      include: {
        user: {
          select: { id: true, name: true, phone: true, createdAt: true },
        },
      },
    });
    if (!profile || profile.companyId !== company.id) {
      throw new NotFoundException('Dealer not found in this company');
    }

    const [assignments, listings] = await Promise.all([
      this.prisma.leadAssignment.findMany({
        where: { dealerId },
        include: {
          lead: {
            include: {
              requirement: true,
              statusUpdates: { orderBy: { createdAt: 'desc' } },
            },
          },
        },
        orderBy: { acceptedAt: 'desc' },
        take: 100,
      }),
      this.prisma.listing.findMany({
        where: { ownerId: dealerId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    ]);

    return { profile, assignments, listings };
  }

  private async dealerUserIds(companyId: string): Promise<string[]> {
    const rows = await this.prisma.dealerProfile.findMany({
      where: { companyId },
      select: { userId: true },
    });
    return rows.map((r) => r.userId);
  }

  private async getOwnedCompany(ownerId: string) {
    const company = await this.prisma.company.findUnique({
      where: { ownerId },
    });
    if (!company) throw new NotFoundException('No company account found');
    return company;
  }
}
