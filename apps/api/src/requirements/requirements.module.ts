import { Module } from '@nestjs/common';
import { RequirementsController } from './requirements.controller';
import { RequirementsService } from './requirements.service';
import { LeadsModule } from '../leads/leads.module';

@Module({
  imports: [LeadsModule],
  controllers: [RequirementsController],
  providers: [RequirementsService],
})
export class RequirementsModule {}
