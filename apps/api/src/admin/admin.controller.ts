import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { ChatService } from '../chat/chat.service';
import { LeadsService } from '../leads/leads.service';
import { ListingsService } from '../listings/listings.service';
import { ModerateListingDto } from './dto/moderate-listing.dto';
import { ModerateKycDto } from './dto/moderate-kyc.dto';
import { SuspendUserDto } from './dto/suspend-user.dto';
import { ReassignLeadDto } from './dto/reassign-lead.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { ResolveReportDto } from './dto/resolve-report.dto';
import { PromoteListingDto } from './dto/promote-listing.dto';
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
    private readonly leads: LeadsService,
    private readonly listings: ListingsService,
  ) {}

  @Get('stats')
  stats() {
    return this.admin.stats();
  }

  @Get('users')
  listUsers() {
    return this.admin.listUsers();
  }

  @Get('users/:id')
  userDetail(@Param('id') id: string) {
    return this.admin.userDetail(id);
  }

  @Patch('users/:id/suspend')
  suspendUser(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: SuspendUserDto,
  ) {
    return this.admin.setUserSuspended(id, dto.suspended, admin);
  }

  @Delete('users/:id')
  deleteUser(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.admin.deleteUser(id, admin);
  }

  @Get('dealers')
  listDealers() {
    return this.admin.listDealers();
  }

  @Get('dealers/:id')
  dealerDetail(@Param('id') id: string) {
    return this.admin.dealerDetail(id);
  }

  @Patch('dealers/:id/kyc')
  moderateKyc(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ModerateKycDto,
  ) {
    return this.admin.moderateKyc(id, dto, admin);
  }

  @Patch('dealers/:id/suspend')
  suspendDealer(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: SuspendUserDto,
  ) {
    return this.admin.setUserSuspended(id, dto.suspended, admin);
  }

  @Delete('dealers/:id')
  deleteDealer(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.admin.deleteUser(id, admin);
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

  @Patch('listings/:id/promote')
  promoteListing(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: PromoteListingDto,
  ) {
    return this.listings.promote(id, dto.tier, dto.days, admin);
  }

  @Patch('listings/:id/unpromote')
  unpromoteListing(@Param('id') id: string) {
    return this.listings.unpromote(id);
  }

  @Get('leads')
  leadsOverview() {
    return this.admin.leadsOverview();
  }

  @Get('leads/:id')
  leadDetail(@CurrentUser() admin: AuthenticatedUser, @Param('id') id: string) {
    return this.leads.findOne(id, admin);
  }

  @Patch('leads/:id/reassign')
  reassignLead(@Param('id') id: string, @Body() dto: ReassignLeadDto) {
    return this.leads.reassign(id, dto.dealerId);
  }

  @Patch('leads/:id/release')
  releaseLead(@Param('id') id: string) {
    return this.leads.forceRelease(id);
  }

  @Get('companies')
  listCompanies() {
    return this.admin.listCompanies();
  }

  @Get('companies/:id')
  companyDetail(@Param('id') id: string) {
    return this.admin.companyDetail(id);
  }

  @Patch('companies/:id')
  updateCompany(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.admin.updateCompany(id, dto.name, admin);
  }

  @Delete('companies/:id')
  deleteCompany(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.admin.deleteCompany(id, admin);
  }

  @Get('plazas')
  listPlazas() {
    return this.admin.listPlazas();
  }

  @Get('plazas/:id')
  plazaDetail(@Param('id') id: string) {
    return this.admin.plazaDetail(id);
  }

  @Get('leases')
  leasesOverview() {
    return this.admin.leasesOverview();
  }

  @Get('leases/:id')
  leaseDetail(@Param('id') id: string) {
    return this.admin.leaseDetail(id);
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
  listReports(@Query('listingId') listingId?: string) {
    return this.admin.listReports(listingId);
  }

  @Get('reports/:id')
  reportDetail(@Param('id') id: string) {
    return this.admin.reportDetail(id);
  }

  @Patch('reports/:id/resolve')
  resolveReport(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ResolveReportDto,
  ) {
    return this.admin.resolveReport(id, 'RESOLVED', admin, dto.notes);
  }

  @Patch('reports/:id/dismiss')
  dismissReport(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ResolveReportDto,
  ) {
    return this.admin.resolveReport(id, 'DISMISSED', admin, dto.notes);
  }

  @Get('audit-log')
  auditLog(@Query('targetId') targetId?: string) {
    return this.admin.auditLog(targetId);
  }
}
