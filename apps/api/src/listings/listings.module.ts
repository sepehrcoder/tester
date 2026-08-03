import { Module } from '@nestjs/common';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';
import { ListingsScheduler } from './listings.scheduler';

@Module({
  controllers: [ListingsController],
  providers: [ListingsService, ListingsScheduler],
  exports: [ListingsService],
})
export class ListingsModule {}
