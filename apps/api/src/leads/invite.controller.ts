import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';

// Separate controller/prefix from `leads` since these routes are reached
// via the invite link (SH-11 deep-link landing page) — the token stands in
// for auth on the preview endpoint.
@ApiTags('invite')
@Controller('invite')
export class InviteController {
  constructor(private readonly leads: LeadsService) {}

  @Get(':token')
  resolve(@Param('token') token: string) {
    return this.leads.resolveInvite(token);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':token/open')
  open(@CurrentUser() user: AuthenticatedUser, @Param('token') token: string) {
    return this.leads.openInvite(token, user);
  }
}
