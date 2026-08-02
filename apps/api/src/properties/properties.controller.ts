import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PropertiesService } from './properties.service';
import { CreateRentalUnitDto } from './dto/create-rental-unit.dto';
import { UpdateRentalUnitDto } from './dto/update-rental-unit.dto';
import { LinkOwnerDto } from './dto/link-owner.dto';
import { CreateLeaseDto } from './dto/create-lease.dto';
import { CreateRentPaymentDto } from './dto/create-rent-payment.dto';
import { ReviewRentPaymentDto } from './dto/review-rent-payment.dto';
import { CreateUtilityBillDto } from './dto/create-utility-bill.dto';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';

@ApiTags('properties')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class PropertiesController {
  constructor(private readonly properties: PropertiesService) {}

  // -- rental units ----------------------------------------------------

  @UseGuards(RolesGuard)
  @Roles('CUSTOMER', 'DEALER')
  @Post('rental-units')
  createStandalone(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateRentalUnitDto,
  ) {
    return this.properties.createStandaloneUnit(user, dto);
  }

  @UseGuards(RolesGuard)
  @Roles('CUSTOMER', 'DEALER')
  @Get('rental-units/mine')
  listMineOwner(@CurrentUser() user: AuthenticatedUser) {
    return this.properties.listMineOwner(user.id);
  }

  @UseGuards(RolesGuard)
  @Roles('PLAZA_MANAGER')
  @Get('rental-units/managed')
  listManaged(@CurrentUser() user: AuthenticatedUser) {
    return this.properties.listManaged(user.id);
  }

  @Get('rental-units/:id')
  getUnit(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.properties.getUnit(id, user);
  }

  @Patch('rental-units/:id')
  updateUnit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateRentalUnitDto,
  ) {
    return this.properties.updateUnit(id, user, dto);
  }

  @UseGuards(RolesGuard)
  @Roles('PLAZA_MANAGER')
  @Patch('rental-units/:id/link-owner')
  linkOwner(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: LinkOwnerDto,
  ) {
    return this.properties.linkOwner(id, user, dto);
  }

  // -- leases ------------------------------------------------------------

  @Post('rental-units/:id/lease')
  createLease(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateLeaseDto,
  ) {
    return this.properties.createLease(id, user, dto);
  }

  @Patch('leases/:id/end')
  endLease(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.properties.endLease(id, user);
  }

  @UseGuards(RolesGuard)
  @Roles('TENANT')
  @Get('leases/mine')
  myLeases(@CurrentUser() user: AuthenticatedUser) {
    return this.properties.myLeases(user.id);
  }

  @Get('leases/:id')
  getLease(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.properties.getLease(id, user);
  }

  // -- rent payments -----------------------------------------------------

  @UseGuards(RolesGuard)
  @Roles('TENANT')
  @Post('leases/:id/rent-payments')
  createRentPayment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateRentPaymentDto,
  ) {
    return this.properties.createRentPayment(id, user, dto);
  }

  @Get('leases/:id/rent-payments')
  listRentPayments(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.properties.listRentPayments(id, user);
  }

  @Patch('rent-payments/:id/review')
  reviewRentPayment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ReviewRentPaymentDto,
  ) {
    return this.properties.reviewRentPayment(id, user, dto);
  }

  // -- utility bills -----------------------------------------------------

  @UseGuards(RolesGuard)
  @Roles('TENANT')
  @Post('leases/:id/utility-bills')
  createUtilityBill(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateUtilityBillDto,
  ) {
    return this.properties.createUtilityBill(id, user, dto);
  }

  @Get('leases/:id/utility-bills')
  listUtilityBills(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.properties.listUtilityBills(id, user);
  }

  @Patch('utility-bills/:id/settle')
  settleUtilityBill(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.properties.settleUtilityBill(id, user);
  }

  // -- maintenance -------------------------------------------------------

  @Post('leases/:id/maintenance')
  createMaintenance(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateMaintenanceDto,
  ) {
    return this.properties.createMaintenance(id, user, dto);
  }

  @Get('leases/:id/maintenance')
  listMaintenance(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.properties.listMaintenance(id, user);
  }

  @Patch('maintenance/:id')
  updateMaintenance(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateMaintenanceDto,
  ) {
    return this.properties.updateMaintenance(id, user, dto);
  }

  // -- chat ----------------------------------------------------------------

  @Post('leases/:id/chat')
  openChat(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.properties.openLeaseChat(id, user);
  }
}
