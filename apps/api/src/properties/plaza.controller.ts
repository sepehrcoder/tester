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
import { PlazaService } from './plaza.service';
import { PropertiesService } from './properties.service';
import { CreatePlazaDto } from './dto/create-plaza.dto';
import { UpdatePlazaDto } from './dto/update-plaza.dto';
import { CreateRentalUnitDto } from './dto/create-rental-unit.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';

@ApiTags('plazas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PLAZA_MANAGER')
@Controller('plazas')
export class PlazaController {
  constructor(
    private readonly plazas: PlazaService,
    private readonly properties: PropertiesService,
  ) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePlazaDto) {
    return this.plazas.create(user.id, dto);
  }

  @Get('mine')
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.plazas.listMine(user.id);
  }

  @Get(':id')
  getOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.plazas.getOne(id, user);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdatePlazaDto,
  ) {
    return this.plazas.update(id, user, dto);
  }

  @Post(':id/units')
  addUnit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateRentalUnitDto,
  ) {
    return this.properties.createPlazaUnit(id, user, dto);
  }
}
