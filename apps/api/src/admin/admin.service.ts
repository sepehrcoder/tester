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
      totalCompanies,
      totalPlazaManagers,
      totalTenants,
      pendingKyc,
      listingsPending,
      listingsApproved,
      requirementsOpen,
      leadsBroadcast,
      leadsAccepted,
      flaggedMessages,
      openReports,
      totalPlazas,
      totalRentalUnits,
      activeLeases,
      rentPaymentsPendingReview,
      openMaintenance,
    ] = await this.prisma.$transaction([
      this.prisma.user.count({ where: { role: 'CUSTOMER' } }),
      this.prisma.user.count({ where: { role: 'DEALER' } }),
      this.prisma.user.count({ where: { role: 'COMPANY' } }),
      this.prisma.user.count({ where: { role: 'PLAZA_MANAGER' } }),
      this.prisma.user.count({ where: { role: 'TENANT' } }),
      this.prisma.dealerProfile.count({ where: { kycStatus: 'PENDING' } }),
      this.prisma.listing.count({ where: { status: 'PENDING' } }),
      this.prisma.listing.count({ where: { status: 'APPROVED' } }),
      this.prisma.requirement.count({ where: { status: 'OPEN' } }),
      this.prisma.lead.count({ where: { status: 'BROADCAST' } }),
      this.prisma.lead.count({ where: { status: 'ACCEPTED' } }),
      this.prisma.message.count({ where: { flagged: true } }),
      this.prisma.report.count({ where: { status: 'OPEN' } }),
      this.prisma.plaza.count(),
      this.prisma.rentalUnit.count(),
      this.prisma.lease.count({ where: { status: 'ACTIVE' } }),
      this.prisma.rentPayment.count({ where: { status: 'SUBMITTED' } }),
      this.prisma.maintenanceRequest.count({
        where: { status: { not: 'RESOLVED' } },
      }),
    ]);

    return {
      totalUsers,
      totalDealers,
      totalCompanies,
      totalPlazaManagers,
      totalTenants,
      pendingKyc,
      listingsPending,
      listingsApproved,
      requirementsOpen,
      leadsBroadcast,
      leadsAccepted,
      flaggedMessages,
      openReports,
      totalPlazas,
      totalRentalUnits,
      activeLeases,
      rentPaymentsPendingReview,
      openMaintenance,
    };
  }

  listUsers() {
    return this.prisma.user.findMany({
      where: { role: { notIn: ['ADMIN', 'DEALER'] } },
      omit: { passwordHash: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  listCompanies() {
    return this.prisma.company.findMany({
      include: {
        owner: { select: { id: true, name: true, phone: true } },
        _count: { select: { dealers: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async listPlazas() {
    const plazas = await this.prisma.plaza.findMany({
      include: {
        manager: { select: { id: true, name: true, phone: true } },
        _count: { select: { units: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const occupancy = await this.prisma.rentalUnit.groupBy({
      by: ['plazaId', 'occupancy'],
      where: { plazaId: { in: plazas.map((p) => p.id) } },
      _count: true,
    });

    return plazas.map((plaza) => ({
      ...plaza,
      unitCount: plaza._count.units,
      occupiedCount:
        occupancy.find(
          (o) => o.plazaId === plaza.id && o.occupancy === 'OCCUPIED',
        )?._count ?? 0,
    }));
  }

  leasesOverview() {
    return this.prisma.lease.findMany({
      include: {
        tenant: { select: { id: true, name: true, phone: true } },
        unit: {
          include: {
            plaza: { select: { id: true, name: true } },
            owner: { select: { id: true, name: true } },
          },
        },
        _count: {
          select: {
            rentPayments: { where: { status: 'SUBMITTED' } },
            maintenance: { where: { status: { not: 'RESOLVED' } } },
          },
        },
      },
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
