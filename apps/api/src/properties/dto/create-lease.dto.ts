import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  MinLength,
} from 'class-validator';

export class CreateLeaseDto {
  @ApiProperty({
    example: '+923001234567',
    description: 'Must already be registered as a TENANT.',
  })
  @IsString()
  @MinLength(8)
  tenantPhone: string;

  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiProperty()
  @IsDateString()
  endDate: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  rentAmount: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  depositAmount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  agreementUrl?: string;
}
