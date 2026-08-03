import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

  async companyDetail(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, phone: true } },
        dealers: {
          include: {
            user: { select: { id: true, name: true, phone: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async updateCompany(id: string, name: string, admin: AuthenticatedUser) {
    const updated = await this.prisma.company.update({
      where: { id },
      data: { name },
    });
    await this.audit(admin.id, 'COMPANY_UPDATED', 'Company', id);
    return updated;
  }

  async deleteCompany(id: string, admin: AuthenticatedUser) {
    const dealerCount = await this.prisma.dealerProfile.count({
      where: { companyId: id },
    });
    if (dealerCount > 0) {
      throw new BadRequestException(
        `This company still has ${dealerCount} dealer(s) attached — move or remove them first`,
      );
    }
    await this.prisma.company.delete({ where: { id } });
    await this.audit(admin.id, 'COMPANY_DELETED', 'Company', id);
    return { id };
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

  async plazaDetail(id: string) {
    const plaza = await this.prisma.plaza.findUnique({
      where: { id },
      include: {
        manager: { select: { id: true, name: true, phone: true } },
        units: {
          include: {
            owner: { select: { id: true, name: true } },
            leases: {
              where: { status: 'ACTIVE' },
              include: { tenant: { select: { id: true, name: true } } },
            },
          },
          orderBy: { floorNumber: 'asc' },
        },
      },
    });
    if (!plaza) throw new NotFoundException('Plaza not found');
    return plaza;
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

  async leaseDetail(id: string) {
    const lease = await this.prisma.lease.findUnique({
      where: { id },
      include: {
        tenant: { select: { id: true, name: true, phone: true } },
        unit: {
          include: {
            plaza: { select: { id: true, name: true } },
            owner: { select: { id: true, name: true } },
          },
        },
        rentPayments: { orderBy: { forMonth: 'desc' } },
        utilityBills: { orderBy: { billMonth: 'desc' } },
        maintenance: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!lease) throw new NotFoundException('Lease not found');
    return lease;
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

  async dealerDetail(id: string) {
    const dealer = await this.prisma.user.findUnique({
      where: { id },
      omit: { passwordHash: true },
      include: {
        dealerProfile: { include: { company: { select: { id: true, name: true } } } },
        listings: {
          include: { photos: { take: 1 } },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        leadsAsDealer: {
          include: { requirement: true },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        reviewsReceived: {
          include: { customer: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });
    if (!dealer || dealer.role !== 'DEALER')
      throw new NotFoundException('Dealer not found');
    return dealer;
  }

  async userDetail(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      omit: { passwordHash: true },
      include: {
        companyOwned: { select: { id: true, name: true } },
        listings: { orderBy: { createdAt: 'desc' }, take: 50 },
        requirements: {
          include: { leads: { select: { id: true, status: true } } },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        leasesAsTenant: {
          include: { unit: { select: { id: true, title: true, city: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async setUserSuspended(
    id: string,
    suspended: boolean,
    admin: AuthenticatedUser,
  ) {
    const updated = await this.prisma.user.update({
      where: { id },
      data: { suspendedAt: suspended ? new Date() : null },
      omit: { passwordHash: true },
    });
    await this.audit(
      admin.id,
      suspended ? 'USER_SUSPENDED' : 'USER_REINSTATED',
      'User',
      id,
    );
    return updated;
  }

  async deleteUser(id: string, admin: AuthenticatedUser) {
    await this.prisma.user.delete({ where: { id } });
    await this.audit(admin.id, 'USER_DELETED', 'User', id);
    return { id };
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

  listReports(listingId?: string) {
    return this.prisma.report.findMany({
      where: listingId ? { listingId } : undefined,
      include: {
        reporter: { select: { id: true, name: true } },
        listing: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async reportDetail(id: string) {
    const report = await this.prisma.report.findUnique({
      where: { id },
      include: {
        reporter: { select: { id: true, name: true, phone: true } },
        listing: {
          include: {
            photos: { take: 1 },
            owner: { select: { id: true, name: true } },
          },
        },
      },
    });
    if (!report) throw new NotFoundException('Report not found');
    return report;
  }

  async resolveReport(
    id: string,
    status: 'RESOLVED' | 'DISMISSED',
    admin: AuthenticatedUser,
    resolutionNotes?: string,
  ) {
    const updated = await this.prisma.report.update({
      where: { id },
      data: { status, resolutionNotes },
    });
    await this.audit(admin.id, `REPORT_${status}`, 'Report', id);
    return updated;
  }

  // -- audit log -----------------------------------------------------------

  auditLog(targetId?: string) {
    return this.prisma.auditLog.findMany({
      where: targetId ? { targetId } : undefined,
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
