import { randomBytes } from 'crypto';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import type { Requirement } from '../../generated/prisma/client';

const TERMINAL_STAGES = new Set(['CLOSED_WON', 'CLOSED_LOST']);

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly config: ConfigService,
  ) {}

  private get slaHours(): number {
    return Number(this.config.get('LEAD_SLA_HOURS', '6'));
  }

  // -- creation & broadcast --------------------------------------------------

  async createBroadcastLead(requirement: Requirement) {
    const lead = await this.prisma.lead.create({
      data: { requirementId: requirement.id, status: 'BROADCAST' },
    });
    await this.notifyMatchedDealers(
      requirement,
      'A new requirement matches your coverage area.',
    );
    return lead;
  }

  private async matchedDealerIds(requirement: Requirement): Promise<string[]> {
    const dealers = await this.prisma.dealerProfile.findMany({
      where: {
        kycStatus: 'APPROVED',
        coverageCities: { has: requirement.city },
        propertyTypes: { has: requirement.propertyType },
      },
      select: { userId: true },
    });
    return dealers.map((d) => d.userId);
  }

  private async notifyMatchedDealers(requirement: Requirement, body: string) {
    const dealerIds = await this.matchedDealerIds(requirement);
    await this.notifications.createMany(
      dealerIds,
      'LEAD_BROADCAST',
      `New lead in ${requirement.city}`,
      body,
      { requirementId: requirement.id },
    );
  }

  // -- dealer-facing reads ----------------------------------------------------

  async feedForDealer(dealerId: string) {
    const profile = await this.prisma.dealerProfile.findUnique({
      where: { userId: dealerId },
    });
    if (!profile) return [];

    return this.prisma.lead.findMany({
      where: {
        status: 'BROADCAST',
        requirement: {
          city: { in: profile.coverageCities },
          propertyType: { in: profile.propertyTypes },
          status: 'OPEN',
        },
      },
      include: { requirement: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  myAssignments(dealerId: string) {
    return this.prisma.leadAssignment.findMany({
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
    });
  }

  async findOne(id: string, requester: AuthenticatedUser) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: {
        requirement: true,
        statusUpdates: { orderBy: { createdAt: 'desc' } },
        dealer: { select: { id: true, name: true, phone: true } },
      },
    });
    if (!lead) throw new NotFoundException('Lead not found');

    const isDealer = lead.dealerId === requester.id;
    const isCustomer = lead.requirement.customerId === requester.id;
    if (!isDealer && !isCustomer && requester.role !== 'ADMIN') {
      throw new ForbiddenException();
    }
    return lead;
  }

  // -- the accept/lock mechanic -------------------------------------------

  async accept(leadId: string, dealer: AuthenticatedUser) {
    const inviteToken = randomBytes(16).toString('hex');
    const slaDeadline = new Date(Date.now() + this.slaHours * 60 * 60 * 1000);

    // Atomic claim: the WHERE clause only matches while the lead is still
    // unclaimed, so two dealers racing to accept the same lead can never
    // both succeed — the second update simply matches zero rows.
    const result = await this.prisma.lead.updateMany({
      where: { id: leadId, status: 'BROADCAST', dealerId: null },
      data: {
        status: 'ACCEPTED',
        dealerId: dealer.id,
        acceptedAt: new Date(),
        slaDeadline,
        inviteToken,
      },
    });

    if (result.count === 0) {
      const exists = await this.prisma.lead.findUnique({
        where: { id: leadId },
      });
      if (!exists) throw new NotFoundException('Lead not found');
      throw new ConflictException(
        'This lead has already been claimed by another dealer',
      );
    }

    const lead = await this.prisma.lead.findUniqueOrThrow({
      where: { id: leadId },
      include: { requirement: true },
    });

    await this.prisma.leadAssignment.create({
      data: {
        leadId: lead.id,
        dealerId: dealer.id,
        acceptedAt: lead.acceptedAt!,
      },
    });

    const conversation = await this.findOrCreateConversation(
      lead.id,
      lead.requirement.customerId,
      dealer.id,
    );

    await this.notifications.create(
      lead.requirement.customerId,
      'LEAD_ACCEPTED',
      'A dealer picked up your requirement',
      'Open the app to start chatting — an invite link has also been generated.',
      { leadId: lead.id, conversationId: conversation.id },
    );

    return { ...lead, conversationId: conversation.id };
  }

  private async findOrCreateConversation(
    leadId: string,
    customerId: string,
    dealerId: string,
  ) {
    const existing = await this.prisma.conversation.findFirst({
      where: { leadId },
    });
    if (existing) return existing;

    return this.prisma.conversation.create({
      data: {
        leadId,
        participants: {
          create: [{ userId: customerId }, { userId: dealerId }],
        },
      },
    });
  }

  // -- structured status updates -------------------------------------------

  async addStatusUpdate(
    leadId: string,
    dealer: AuthenticatedUser,
    dto: UpdateLeadStatusDto,
  ) {
    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new NotFoundException('Lead not found');
    if (lead.status !== 'ACCEPTED' || lead.dealerId !== dealer.id) {
      throw new ForbiddenException(
        'This lead is not currently assigned to you',
      );
    }

    await this.prisma.leadStatusUpdate.create({
      data: { leadId, dealerId: dealer.id, stage: dto.stage, note: dto.note },
    });

    if (TERMINAL_STAGES.has(dto.stage)) {
      return this.finalize(lead, dto.stage as 'CLOSED_WON' | 'CLOSED_LOST');
    }

    // Any real update resets the SLA clock — the dealer is actively working it.
    return this.prisma.lead.update({
      where: { id: leadId },
      data: {
        slaDeadline: new Date(Date.now() + this.slaHours * 60 * 60 * 1000),
      },
    });
  }

  private async finalize(
    lead: { id: string; requirementId: string; dealerId: string | null },
    outcome: 'CLOSED_WON' | 'CLOSED_LOST',
  ) {
    const [updatedLead] = await this.prisma.$transaction([
      this.prisma.lead.update({
        where: { id: lead.id },
        data: { status: outcome, slaDeadline: null },
      }),
      this.prisma.requirement.update({
        where: { id: lead.requirementId },
        data: { status: 'CLOSED' },
      }),
      this.prisma.leadAssignment.updateMany({
        where: { leadId: lead.id, dealerId: lead.dealerId!, releasedAt: null },
        data: { releasedAt: new Date(), outcome },
      }),
    ]);
    return updatedLead;
  }

  // -- SLA enforcement -------------------------------------------------------

  /** Leads whose dealer went quiet past the SLA window reopen to every matched dealer again. */
  async releaseExpiredLeads(): Promise<number> {
    const expired = await this.prisma.lead.findMany({
      where: { status: 'ACCEPTED', slaDeadline: { lt: new Date() } },
      include: { requirement: true },
    });

    for (const lead of expired) {
      await this.prisma.$transaction([
        this.prisma.lead.update({
          where: { id: lead.id },
          data: {
            status: 'BROADCAST',
            dealerId: null,
            acceptedAt: null,
            slaDeadline: null,
            inviteToken: null,
          },
        }),
        this.prisma.leadAssignment.updateMany({
          where: {
            leadId: lead.id,
            dealerId: lead.dealerId!,
            releasedAt: null,
          },
          data: { releasedAt: new Date(), outcome: 'RELEASED_SLA' },
        }),
      ]);

      if (lead.dealerId) {
        await this.notifications.create(
          lead.dealerId,
          'LEAD_RELEASED',
          'A lead you had was reopened',
          'No update was logged within the SLA window, so this lead is now available to other dealers again.',
          { leadId: lead.id },
        );
      }
      await this.notifyMatchedDealers(
        lead.requirement,
        'A previously claimed lead is available again.',
      );
    }

    if (expired.length > 0)
      this.logger.log(`Released ${expired.length} lead(s) past SLA deadline`);
    return expired.length;
  }

  // -- invite link -------------------------------------------------------

  async resolveInvite(token: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { inviteToken: token },
      include: { requirement: true, dealer: { select: { name: true } } },
    });
    if (!lead)
      throw new NotFoundException('Invite link is invalid or has expired');

    return {
      leadId: lead.id,
      dealerName: lead.dealer?.name,
      city: lead.requirement.city,
      propertyType: lead.requirement.propertyType,
    };
  }

  async openInvite(token: string, customer: AuthenticatedUser) {
    const lead = await this.prisma.lead.findUnique({
      where: { inviteToken: token },
      include: { requirement: true },
    });
    if (!lead)
      throw new NotFoundException('Invite link is invalid or has expired');
    if (lead.requirement.customerId !== customer.id) {
      throw new ForbiddenException(
        'This invite belongs to a different account',
      );
    }

    const conversation = await this.prisma.conversation.findFirst({
      where: { leadId: lead.id },
    });
    if (!conversation)
      throw new NotFoundException('Conversation not found for this lead');
    return { conversationId: conversation.id };
  }
}
