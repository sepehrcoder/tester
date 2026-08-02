import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { FurnishingStatus, UnitLayout } from '../../../generated/prisma/enums';

export class CreateRentalUnitDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  title: string;

  @ApiProperty()
  @IsString()
  city: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  area?: string;

  @ApiProperty({ enum: UnitLayout })
  @IsEnum(UnitLayout)
  unitLayout: UnitLayout;

  @ApiProperty({ enum: FurnishingStatus })
  @IsEnum(FurnishingStatus)
  furnishing: FurnishingStatus;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  monthlyRent: number;

  @ApiProperty({
    required: false,
    description: 'Only meaningful for plaza-embedded units.',
  })
  @IsOptional()
  @IsInt()
  floorNumber?: number;
}
