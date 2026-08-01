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
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateDealerProfileDto } from './dto/update-dealer-profile.dto';
import { SubmitKycDto } from './dto/submit-kyc.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.users.updateProfile(user.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DEALER')
  @Patch('me/dealer-profile')
  updateDealerProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateDealerProfileDto,
  ) {
    return this.users.updateDealerProfile(user.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DEALER')
  @Post('me/dealer-profile/kyc')
  submitKyc(@CurrentUser() user: AuthenticatedUser, @Body() dto: SubmitKycDto) {
    return this.users.submitKyc(user.id, dto);
  }

  @Get(':id/public')
  getPublicDealerProfile(@Param('id') id: string) {
    return this.users.getPublicDealerProfile(id);
  }
}
