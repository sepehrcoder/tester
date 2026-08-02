import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PropertiesService } from './properties.service';

@Injectable()
export class PropertiesScheduler {
  constructor(private readonly properties: PropertiesService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleLeaseExpiry() {
    await this.properties.expireOverdueLeases();
  }
}
