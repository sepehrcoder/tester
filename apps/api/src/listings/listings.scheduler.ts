import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ListingsService } from './listings.service';

@Injectable()
export class ListingsScheduler {
  constructor(private readonly listings: ListingsService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handlePromotionExpiry() {
    await this.listings.releaseExpiredPromotions();
  }
}
