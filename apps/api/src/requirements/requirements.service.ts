import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LeadsService } from '../leads/leads.service';
import { CreateRequirementDto } from './dto/create-requirement.dto';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';

@Injectable()
export class RequirementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly leads: LeadsService,
  ) {}

  async create(customer: AuthenticatedUser, dto: CreateRequirementDto) {
    const requirement = await this.prisma.requirement.create({
      data: { ...dto, customerId: customer.id },
    });
    const lead = await this.leads.createBroadcastLead(requirement);
    return { ...requirement, leadId: lead.id };
  }

  findMine(customerId: string) {
    return this.prisma.requirement.findMany({
      where: { customerId },
      include: { leads: { orderBy: { createdAt: 'desc' }, take: 1 } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, requester: AuthenticatedUser) {
    const requirement = await this.prisma.requirement.findUnique({
      where: { id },
      include: { leads: { orderBy: { createdAt: 'desc' } } },
    });
    if (!requirement) throw new NotFoundException('Requirement not found');
    if (requirement.customerId !== requester.id && requester.role !== 'ADMIN') {
      throw new ForbiddenException();
    }
    return requirement;
  }

  async cancel(id: string, customer: AuthenticatedUser) {
    const requirement = await this.findOne(id, customer);
    if (requirement.customerId !== customer.id) throw new ForbiddenException();

    await this.prisma.requirement.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
    await this.prisma.lead.updateMany({
      where: { requirementId: id, status: { in: ['BROADCAST', 'ACCEPTED'] } },
      data: { status: 'CLOSED_LOST', slaDeadline: null },
    });
    return { id, status: 'CANCELLED' as const };
  }
}
