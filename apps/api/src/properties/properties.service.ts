import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateRentalUnitDto } from './dto/create-rental-unit.dto';
import { UpdateRentalUnitDto } from './dto/update-rental-unit.dto';
import { LinkOwnerDto } from './dto/link-owner.dto';
import { CreateLeaseDto } from './dto/create-lease.dto';
import { CreateRentPaymentDto } from './dto/create-rent-payment.dto';
import { ReviewRentPaymentDto } from './dto/review-rent-payment.dto';
import { CreateUtilityBillDto } from './dto/create-utility-bill.dto';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';

const UNIT_WITH_CONTROL_INCLUDE = {
  plaza: { select: { id: true, name: true, managerId: true } },
  owner: { select: { id: true, name: true, phone: true } },
} as const;

@Injectable()
export class PropertiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // -- units ---------------------------------------------------------------

  createStandaloneUnit(owner: AuthenticatedUser, dto: CreateRentalUnitDto) {
    const { floorNumber, ...rest } = dto;
    void floorNumber; // not meaningful for a standalone (non-plaza) unit
    return this.prisma.rentalUnit.create({
      data: { ...rest, ownerId: owner.id },
    });
  }

  async createPlazaUnit(
    plazaId: string,
    manager: AuthenticatedUser,
    dto: CreateRentalUnitDto,
  ) {
    const plaza = await this.prisma.plaza.findUnique({
      where: { id: plazaId },
    });
    if (!plaza) throw new NotFoundException('Plaza not found');
    if (plaza.managerId !== manager.id) throw new ForbiddenException();

    return this.prisma.rentalUnit.create({ data: { ...dto, plazaId } });
  }

  listMineOwner(ownerId: string) {
    return this.prisma.rentalUnit.findMany({
      where: { ownerId },
      include: {
        plaza: { select: { id: true, name: true } },
        leases: {
          where: { status: 'ACTIVE' },
          include: {
            tenant: { select: { id: true, name: true, phone: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  listManaged(managerId: string) {
    return this.prisma.rentalUnit.findMany({
      where: { plaza: { managerId } },
      include: {
        plaza: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true, phone: true } },
        leases: {
          where: { status: 'ACTIVE' },
          include: {
            tenant: { select: { id: true, name: true, phone: true } },
          },
        },
      },
      orderBy: [{ plazaId: 'asc' }, { floorNumber: 'asc' }],
    });
  }

  async getUnit(id: string, user: AuthenticatedUser) {
    const unit = await this.prisma.rentalUnit.findUnique({
      where: { id },
      include: {
        ...UNIT_WITH_CONTROL_INCLUDE,
        leases: {
          include: {
            tenant: { select: { id: true, name: true, phone: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!unit) throw new NotFoundException('Rental unit not found');
    await this.assertUnitAccess(unit, user);
    return unit;
  }

  async updateUnit(
    id: string,
    user: AuthenticatedUser,
    dto: UpdateRentalUnitDto,
  ) {
    const unit = await this.loadUnit(id);
    this.assertUnitControl(unit, user);
    return this.prisma.rentalUnit.update({ where: { id }, data: dto });
  }

  async linkOwner(id: string, manager: AuthenticatedUser, dto: LinkOwnerDto) {
    const unit = await this.loadUnit(id);
    if (!unit.plazaId || unit.plaza?.managerId !== manager.id)
      throw new ForbiddenException();

    const owner = await this.prisma.user.findUnique({
      where: { phone: dto.ownerPhone },
    });
    if (!owner)
      throw new NotFoundException('No account with that phone number');
    if (owner.role !== 'CUSTOMER' && owner.role !== 'DEALER') {
      throw new BadRequestException('That account cannot own a rental unit');
    }

    return this.prisma.rentalUnit.update({
      where: { id },
      data: { ownerId: owner.id },
    });
  }

  // -- leases ----------------------------------------------------------------

  async createLease(
    unitId: string,
    user: AuthenticatedUser,
    dto: CreateLeaseDto,
  ) {
    const unit = await this.loadUnit(unitId);
    this.assertUnitControl(unit, user);

    if (unit.occupancy === 'OCCUPIED') {
      throw new BadRequestException('This unit already has an active lease');
    }
    if (new Date(dto.endDate) <= new Date(dto.startDate)) {
      throw new BadRequestException('endDate must be after startDate');
    }

    const tenant = await this.prisma.user.findUnique({
      where: { phone: dto.tenantPhone },
    });
    if (!tenant)
      throw new NotFoundException('No account with that phone number');
    if (tenant.role !== 'TENANT') {
      throw new BadRequestException(
        'That account is not registered as a tenant',
      );
    }

    const [lease] = await this.prisma.$transaction([
      this.prisma.lease.create({
        data: {
          unitId,
          tenantId: tenant.id,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
          rentAmount: dto.rentAmount,
          depositAmount: dto.depositAmount,
          agreementUrl: dto.agreementUrl,
        },
      }),
      this.prisma.rentalUnit.update({
        where: { id: unitId },
        data: { occupancy: 'OCCUPIED' },
      }),
    ]);

    await this.notifications.create(
      tenant.id,
      'LEASE_STARTED',
      'You have a new lease',
      `You've been added as the tenant for "${unit.title}".`,
      { leaseId: lease.id, unitId },
    );

    return lease;
  }

  async endLease(id: string, user: AuthenticatedUser) {
    const lease = await this.loadLease(id);
    this.assertUnitControl(lease.unit, user);
    if (lease.status !== 'ACTIVE')
      throw new BadRequestException('Lease is not active');

    await this.prisma.$transaction([
      this.prisma.lease.update({ where: { id }, data: { status: 'ENDED' } }),
      this.prisma.rentalUnit.update({
        where: { id: lease.unitId },
        data: { occupancy: 'VACANT' },
      }),
    ]);
    return { id, status: 'ENDED' as const };
  }

  async getLease(id: string, user: AuthenticatedUser) {
    const lease = await this.loadLease(id);
    this.assertLeaseAccess(lease, user);
    return lease;
  }

  myLeases(tenantId: string) {
    return this.prisma.lease.findMany({
      where: { tenantId },
      include: {
        unit: {
          include: {
            plaza: { select: { id: true, name: true } },
            owner: { select: { id: true, name: true, phone: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // -- rent payments -----------------------------------------------------

  async createRentPayment(
    leaseId: string,
    tenant: AuthenticatedUser,
    dto: CreateRentPaymentDto,
  ) {
    const lease = await this.loadLease(leaseId);
    if (lease.tenantId !== tenant.id) throw new ForbiddenException();
    if (lease.status !== 'ACTIVE')
      throw new BadRequestException('Lease is not active');

    const payment = await this.prisma.rentPayment.create({
      data: {
        leaseId,
        forMonth: new Date(dto.forMonth),
        amount: dto.amount,
        proofUrl: dto.proofUrl,
      },
    });

    const controllerId = lease.unit.ownerId ?? lease.unit.plaza?.managerId;
    if (controllerId) {
      await this.notifications.create(
        controllerId,
        'RENT_PAYMENT_SUBMITTED',
        'A tenant submitted a rent payment',
        `${tenant.name} submitted a payment for "${lease.unit.title}" — review it.`,
        { leaseId, rentPaymentId: payment.id },
      );
    }
    return payment;
  }

  async reviewRentPayment(
    id: string,
    user: AuthenticatedUser,
    dto: ReviewRentPaymentDto,
  ) {
    const payment = await this.prisma.rentPayment.findUnique({
      where: { id },
      include: {
        lease: { include: { unit: { include: UNIT_WITH_CONTROL_INCLUDE } } },
      },
    });
    if (!payment) throw new NotFoundException('Rent payment not found');
    this.assertUnitControl(payment.lease.unit, user);

    return this.prisma.rentPayment.update({
      where: { id },
      data: {
        status: dto.status,
        note: dto.note,
        reviewedById: user.id,
        reviewedAt: new Date(),
      },
    });
  }

  async listRentPayments(leaseId: string, user: AuthenticatedUser) {
    const lease = await this.loadLease(leaseId);
    this.assertLeaseAccess(lease, user);
    return this.prisma.rentPayment.findMany({
      where: { leaseId },
      include: { reviewedBy: { select: { id: true, name: true } } },
      orderBy: { forMonth: 'desc' },
    });
  }

  // -- utility bills -------------------------------------------------------

  async createUtilityBill(
    leaseId: string,
    tenant: AuthenticatedUser,
    dto: CreateUtilityBillDto,
  ) {
    const lease = await this.loadLease(leaseId);
    if (lease.tenantId !== tenant.id) throw new ForbiddenException();

    return this.prisma.utilityBill.create({
      data: {
        leaseId,
        type: dto.type,
        billMonth: new Date(dto.billMonth),
        amount: dto.amount,
        documentUrl: dto.documentUrl,
      },
    });
  }

  async settleUtilityBill(id: string, user: AuthenticatedUser) {
    const bill = await this.prisma.utilityBill.findUnique({
      where: { id },
      include: {
        lease: { include: { unit: { include: UNIT_WITH_CONTROL_INCLUDE } } },
      },
    });
    if (!bill) throw new NotFoundException('Utility bill not found');
    this.assertUnitControl(bill.lease.unit, user);

    return this.prisma.utilityBill.update({
      where: { id },
      data: { status: 'PAID' },
    });
  }

  async listUtilityBills(leaseId: string, user: AuthenticatedUser) {
    const lease = await this.loadLease(leaseId);
    this.assertLeaseAccess(lease, user);
    return this.prisma.utilityBill.findMany({
      where: { leaseId },
      orderBy: { billMonth: 'desc' },
    });
  }

  // -- maintenance -----------------------------------------------------------

  async createMaintenance(
    leaseId: string,
    user: AuthenticatedUser,
    dto: CreateMaintenanceDto,
  ) {
    const lease = await this.loadLease(leaseId);
    this.assertLeaseAccess(lease, user);

    return this.prisma.maintenanceRequest.create({
      data: {
        leaseId,
        raisedById: user.id,
        title: dto.title,
        description: dto.description,
        cost: dto.cost,
      },
    });
  }

  async updateMaintenance(
    id: string,
    user: AuthenticatedUser,
    dto: UpdateMaintenanceDto,
  ) {
    const request = await this.prisma.maintenanceRequest.findUnique({
      where: { id },
      include: {
        lease: { include: { unit: { include: UNIT_WITH_CONTROL_INCLUDE } } },
      },
    });
    if (!request) throw new NotFoundException('Maintenance request not found');
    this.assertUnitControl(request.lease.unit, user);

    return this.prisma.maintenanceRequest.update({
      where: { id },
      data: {
        status: dto.status,
        cost: dto.cost,
        resolvedAt: dto.status === 'RESOLVED' ? new Date() : null,
      },
    });
  }

  async listMaintenance(leaseId: string, user: AuthenticatedUser) {
    const lease = await this.loadLease(leaseId);
    this.assertLeaseAccess(lease, user);
    return this.prisma.maintenanceRequest.findMany({
      where: { leaseId },
      include: { raisedBy: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // -- chat --------------------------------------------------------------

  async openLeaseChat(leaseId: string, user: AuthenticatedUser) {
    const lease = await this.loadLease(leaseId);
    this.assertLeaseAccess(lease, user);

    const existing = await this.prisma.conversation.findFirst({
      where: { leaseId },
    });
    if (existing) return existing;

    const controllerId = lease.unit.ownerId ?? lease.unit.plaza?.managerId;
    if (!controllerId) {
      throw new BadRequestException(
        'This unit has no owner or manager to chat with yet',
      );
    }

    return this.prisma.conversation.create({
      data: {
        leaseId,
        participants: {
          create: [{ userId: lease.tenantId }, { userId: controllerId }],
        },
      },
    });
  }

  // -- shared helpers ------------------------------------------------------

  private async loadUnit(id: string) {
    const unit = await this.prisma.rentalUnit.findUnique({
      where: { id },
      include: UNIT_WITH_CONTROL_INCLUDE,
    });
    if (!unit) throw new NotFoundException('Rental unit not found');
    return unit;
  }

  private async loadLease(id: string) {
    const lease = await this.prisma.lease.findUnique({
      where: { id },
      include: { unit: { include: UNIT_WITH_CONTROL_INCLUDE } },
    });
    if (!lease) throw new NotFoundException('Lease not found');
    return lease;
  }

  private controls(
    unit: { ownerId: string | null; plaza: { managerId: string } | null },
    userId: string,
  ) {
    return unit.ownerId === userId || unit.plaza?.managerId === userId;
  }

  private assertUnitControl(
    unit: { ownerId: string | null; plaza: { managerId: string } | null },
    user: AuthenticatedUser,
  ) {
    if (!this.controls(unit, user.id)) throw new ForbiddenException();
  }

  private async assertUnitAccess(
    unit: {
      id: string;
      ownerId: string | null;
      plaza: { managerId: string } | null;
    },
    user: AuthenticatedUser,
  ) {
    if (this.controls(unit, user.id)) return;
    if (user.role === 'TENANT') {
      const lease = await this.prisma.lease.findFirst({
        where: { unitId: unit.id, tenantId: user.id },
      });
      if (lease) return;
    }
    throw new ForbiddenException();
  }

  private assertLeaseAccess(
    lease: {
      tenantId: string;
      unit: { ownerId: string | null; plaza: { managerId: string } | null };
    },
    user: AuthenticatedUser,
  ) {
    if (lease.tenantId === user.id) return;
    if (this.controls(lease.unit, user.id)) return;
    throw new ForbiddenException();
  }
}
