import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LeadsService } from './leads.service';

@Injectable()
export class LeadsScheduler {
  constructor(private readonly leads: LeadsService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleSlaRelease() {
    await this.leads.releaseExpiredLeads();
  }
}
