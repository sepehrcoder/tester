import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsUrl } from 'class-validator';
import { ListingsService } from './listings.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { SearchListingsDto } from './dto/search-listings.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';

class AddPhotoDto {
  @IsUrl()
  url: string;
}

@ApiTags('listings')
@Controller('listings')
export class ListingsController {
  constructor(private readonly listings: ListingsService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateListingDto,
  ) {
    return this.listings.create(user, dto);
  }

  @Get()
  search(@Query() query: SearchListingsDto) {
    return this.listings.search(query);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('mine')
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.listings.findMine(user.id);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user?: AuthenticatedUser) {
    return this.listings.findOne(id, user);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateListingDto,
  ) {
    return this.listings.update(user, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.listings.remove(user, id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':id/photos')
  addPhoto(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: AddPhotoDto,
  ) {
    return this.listings.addPhoto(user, id, dto.url);
  }
}
