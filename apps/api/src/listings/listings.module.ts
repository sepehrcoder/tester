import { Module } from '@nestjs/common';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';
import { ListingsScheduler } from './listings.scheduler';
import { LocationsModule } from '../locations/locations.module';

@Module({
  imports: [LocationsModule],
  controllers: [ListingsController],
  providers: [ListingsService, ListingsScheduler],
  exports: [ListingsService],
})
export class ListingsModule {}
