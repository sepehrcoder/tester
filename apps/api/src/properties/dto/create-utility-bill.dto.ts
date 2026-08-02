import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsUrl,
  Min,
} from 'class-validator';
import { UtilityType } from '../../../generated/prisma/enums';

export class CreateUtilityBillDto {
  @ApiProperty({ enum: UtilityType })
  @IsEnum(UtilityType)
  type: UtilityType;

  @ApiProperty({ description: 'Any date within the billing month.' })
  @IsDateString()
  billMonth: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  documentUrl?: string;
}
