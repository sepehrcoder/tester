import { Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';

@ApiTags('favorites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}

  @Get()
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.favorites.listMine(user.id);
  }

  @Get('ids')
  listMyIds(@CurrentUser() user: AuthenticatedUser) {
    return this.favorites.listMyIds(user.id);
  }

  @Post(':listingId')
  add(@CurrentUser() user: AuthenticatedUser, @Param('listingId') listingId: string) {
    return this.favorites.add(user.id, listingId);
  }

  @Delete(':listingId')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('listingId') listingId: string) {
    return this.favorites.remove(user.id, listingId);
  }
}
