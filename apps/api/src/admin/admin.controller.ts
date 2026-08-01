import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { ChatService } from '../chat/chat.service';
import { ModerateListingDto } from './dto/moderate-listing.dto';
import { ModerateKycDto } from './dto/moderate-kyc.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import type { ListingStatus } from '../../generated/prisma/enums';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly chat: ChatService,
  ) {}

  @Get('stats')
  stats() {
    return this.admin.stats();
  }

  @Get('users')
  listUsers() {
    return this.admin.listUsers();
  }

  @Get('dealers')
  listDealers() {
    return this.admin.listDealers();
  }

  @Patch('dealers/:id/kyc')
  moderateKyc(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ModerateKycDto,
  ) {
    return this.admin.moderateKyc(id, dto, admin);
  }

  @Get('listings')
  listingsQueue(@Query('status') status?: ListingStatus) {
    return this.admin.listingsQueue(status);
  }

  @Patch('listings/:id/moderate')
  moderateListing(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ModerateListingDto,
  ) {
    return this.admin.moderateListing(id, dto, admin);
  }

  @Get('leads')
  leadsOverview() {
    return this.admin.leadsOverview();
  }

  @Get('chat/conversations')
  chatConversations() {
    return this.chat.adminListConversations();
  }

  @Get('chat/conversations/:id/messages')
  chatMessages(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.chat.getMessages(id, admin.id, true);
  }

  @Get('chat/flagged')
  flaggedQueue() {
    return this.chat.flaggedQueue();
  }

  @Get('reports')
  listReports() {
    return this.admin.listReports();
  }

  @Patch('reports/:id/resolve')
  resolveReport(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.admin.resolveReport(id, 'RESOLVED', admin);
  }

  @Patch('reports/:id/dismiss')
  dismissReport(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.admin.resolveReport(id, 'DISMISSED', admin);
  }

  @Get('audit-log')
  auditLog() {
    return this.admin.auditLog();
  }
}
