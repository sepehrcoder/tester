import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CompanyService } from './company.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';

@ApiTags('company')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('COMPANY')
@Controller('company')
export class CompanyController {
  constructor(private readonly company: CompanyService) {}

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.company.me(user.id);
  }

  @Get('overview')
  overview(@CurrentUser() user: AuthenticatedUser) {
    return this.company.overview(user.id);
  }

  @Get('dealers')
  dealers(@CurrentUser() user: AuthenticatedUser) {
    return this.company.dealers(user.id);
  }

  @Get('dealers/:dealerId')
  dealerDetail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('dealerId') dealerId: string,
  ) {
    return this.company.dealerDetail(user.id, dealerId);
  }
}
