import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';

@ApiTags('leads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('leads')
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  @UseGuards(RolesGuard)
  @Roles('DEALER')
  @Get('feed')
  feed(@CurrentUser() user: AuthenticatedUser) {
    return this.leads.feedForDealer(user.id);
  }

  @UseGuards(RolesGuard)
  @Roles('DEALER')
  @Get('mine')
  mine(@CurrentUser() user: AuthenticatedUser) {
    return this.leads.myAssignments(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.leads.findOne(id, user);
  }

  @UseGuards(RolesGuard)
  @Roles('DEALER')
  @Post(':id/accept')
  accept(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.leads.accept(id, user);
  }

  @UseGuards(RolesGuard)
  @Roles('DEALER')
  @Post(':id/status')
  addStatusUpdate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateLeadStatusDto,
  ) {
    return this.leads.addStatusUpdate(id, user, dto);
  }
}
