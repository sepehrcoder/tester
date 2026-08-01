import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { PropertyType } from '../../../generated/prisma/enums';

export class UpdateDealerProfileDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  agencyName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  coverageCities?: string[];

  @ApiProperty({ required: false, enum: PropertyType, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(PropertyType, { each: true })
  propertyTypes?: PropertyType[];
}
