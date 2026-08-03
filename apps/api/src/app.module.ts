import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ListingsModule } from './listings/listings.module';
import { RequirementsModule } from './requirements/requirements.module';
import { LeadsModule } from './leads/leads.module';
import { ChatModule } from './chat/chat.module';
import { ReviewsModule } from './reviews/reviews.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdminModule } from './admin/admin.module';
import { CompanyModule } from './company/company.module';
import { PropertiesModule } from './properties/properties.module';
import { AiModule } from './ai/ai.module';
import { LocationsModule } from './locations/locations.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    ListingsModule,
    RequirementsModule,
    LeadsModule,
    ChatModule,
    ReviewsModule,
    NotificationsModule,
    AdminModule,
    CompanyModule,
    PropertiesModule,
    AiModule,
    LocationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
