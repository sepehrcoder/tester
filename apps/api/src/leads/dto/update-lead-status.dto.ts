import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { LeadStage } from '../../../generated/prisma/enums';

export class UpdateLeadStatusDto {
  @ApiProperty({ enum: LeadStage })
  @IsEnum(LeadStage)
  stage: LeadStage;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  note?: string;
}
