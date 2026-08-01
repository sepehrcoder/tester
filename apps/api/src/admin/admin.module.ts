import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { ReportsController } from './reports.controller';
import { AdminService } from './admin.service';
import { ListingsModule } from '../listings/listings.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [ListingsModule, ChatModule],
  controllers: [AdminController, ReportsController],
  providers: [AdminService],
})
export class AdminModule {}
