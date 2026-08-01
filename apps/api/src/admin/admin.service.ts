import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListingsService } from '../listings/listings.service';
import { ModerateListingDto } from './dto/moderate-listing.dto';
import { ModerateKycDto } from './dto/moderate-kyc.dto';
import { CreateReportDto } from './dto/create-report.dto';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import type { ListingStatus } from '../../generated/prisma/enums';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly listings: ListingsService,
  ) {}

  async stats() {
    const [
      totalUsers,
      totalDealers,
      pendingKyc,
      listingsPending,
      listingsApproved,
      requirementsOpen,
      leadsBroadcast,
      leadsAccepted,
      flaggedMessages,
      openReports,
    ] = await this.prisma.$transaction([
      this.prisma.user.count({ where: { role: 'CUSTOMER' } }),
      this.prisma.user.count({ where: { role: 'DEALER' } }),
      this.prisma.dealerProfile.count({ where: { kycStatus: 'PENDING' } }),
      this.prisma.listing.count({ where: { status: 'PENDING' } }),
      this.prisma.listing.count({ where: { status: 'APPROVED' } }),
      this.prisma.requirement.count({ where: { status: 'OPEN' } }),
      this.prisma.lead.count({ where: { status: 'BROADCAST' } }),
      this.prisma.lead.count({ where: { status: 'ACCEPTED' } }),
      this.prisma.message.count({ where: { flagged: true } }),
      this.prisma.report.count({ where: { status: 'OPEN' } }),
    ]);

    return {
      totalUsers,
      totalDealers,
      pendingKyc,
      listingsPending,
      listingsApproved,
      requirementsOpen,
      leadsBroadcast,
      leadsAccepted,
      flaggedMessages,
      openReports,
    };
  }

  listUsers() {
    return this.prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      omit: { passwordHash: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  listDealers() {
    return this.prisma.user.findMany({
      where: { role: 'DEALER' },
      omit: { passwordHash: true },
      include: { dealerProfile: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async moderateKyc(
    dealerId: string,
    dto: ModerateKycDto,
    admin: AuthenticatedUser,
  ) {
    const profile = await this.prisma.dealerProfile.findUnique({
      where: { userId: dealerId },
    });
    if (!profile) throw new NotFoundException('Dealer profile not found');

    const updated = await this.prisma.dealerProfile.update({
      where: { userId: dealerId },
      data: { kycStatus: dto.status },
    });
    await this.audit(admin.id, `KYC_${dto.status}`, 'DealerProfile', dealerId);
    return updated;
  }

  listingsQueue(status?: ListingStatus) {
    return this.prisma.listing.findMany({
      where: status ? { status } : undefined,
      include: {
        photos: { take: 1 },
        owner: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async moderateListing(
    id: string,
    dto: ModerateListingDto,
    admin: AuthenticatedUser,
  ) {
    const updated = await this.listings.setStatus(id, dto.status, dto.verified);
    await this.audit(admin.id, `LISTING_${dto.status}`, 'Listing', id);
    return updated;
  }

  leadsOverview() {
    return this.prisma.lead.findMany({
      include: {
        requirement: true,
        dealer: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  // -- reports -----------------------------------------------------------

  createReport(reporter: AuthenticatedUser, dto: CreateReportDto) {
    return this.prisma.report.create({
      data: {
        reporterId: reporter.id,
        targetType: dto.targetType,
        listingId: dto.listingId,
        reason: dto.reason,
      },
    });
  }

  listReports() {
    return this.prisma.report.findMany({
      include: {
        reporter: { select: { id: true, name: true } },
        listing: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async resolveReport(
    id: string,
    status: 'RESOLVED' | 'DISMISSED',
    admin: AuthenticatedUser,
  ) {
    const updated = await this.prisma.report.update({
      where: { id },
      data: { status },
    });
    await this.audit(admin.id, `REPORT_${status}`, 'Report', id);
    return updated;
  }

  // -- audit log -----------------------------------------------------------

  auditLog() {
    return this.prisma.auditLog.findMany({
      include: { actor: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  private audit(
    actorId: string,
    action: string,
    targetType: string,
    targetId: string,
  ) {
    return this.prisma.auditLog.create({
      data: { actorId, action, targetType, targetId },
    });
  }
}
