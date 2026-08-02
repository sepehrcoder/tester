import { Module } from '@nestjs/common';
import { LeadsController } from './leads.controller';
import { InviteController } from './invite.controller';
import { LeadsService } from './leads.service';
import { LeadsScheduler } from './leads.scheduler';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [LeadsController, InviteController],
  providers: [LeadsService, LeadsScheduler],
  exports: [LeadsService],
})
export class LeadsModule {}
