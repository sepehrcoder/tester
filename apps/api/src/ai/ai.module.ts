import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { GeminiClient } from './gemini.client';
import { ListingsModule } from '../listings/listings.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [ListingsModule, NotificationsModule],
  controllers: [AiController],
  providers: [AiService, GeminiClient],
  exports: [AiService],
})
export class AiModule {}
