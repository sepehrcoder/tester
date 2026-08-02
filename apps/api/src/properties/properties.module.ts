import { Module } from '@nestjs/common';
import { PlazaController } from './plaza.controller';
import { PlazaService } from './plaza.service';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { PropertiesScheduler } from './properties.scheduler';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [PlazaController, PropertiesController],
  providers: [PlazaService, PropertiesService, PropertiesScheduler],
})
export class PropertiesModule {}
