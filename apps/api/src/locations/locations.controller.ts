import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LocationsService } from './locations.service';

@ApiTags('locations')
@Controller('locations')
export class LocationsController {
  constructor(private readonly locations: LocationsService) {}

  @Get('societies')
  listSocieties(@Query('city') city: string, @Query('q') q?: string) {
    return this.locations.listSocieties(city ?? '', q);
  }

  @Get('phases')
  listPhases(@Query('societyId') societyId: string) {
    return this.locations.listPhases(societyId ?? '');
  }

  @Get('blocks')
  listBlocks(@Query('phaseId') phaseId: string) {
    return this.locations.listBlocks(phaseId ?? '');
  }
}
