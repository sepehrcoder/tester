import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ReportTargetType } from '../../../generated/prisma/enums';

export class CreateReportDto {
  @ApiProperty({ enum: ReportTargetType })
  @IsEnum(ReportTargetType)
  targetType: ReportTargetType;

  @ApiProperty({
    required: false,
    description: 'Required when targetType is LISTING',
  })
  @IsOptional()
  @IsString()
  listingId?: string;

  @ApiProperty()
  @IsString()
  @MinLength(4)
  reason: string;
}
