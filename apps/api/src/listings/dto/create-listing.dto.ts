import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  MinLength,
} from 'class-validator';
import { ListingPurpose, PropertyType } from '../../../generated/prisma/enums';

export class CreateListingDto {
  @ApiProperty({ enum: ListingPurpose })
  @IsEnum(ListingPurpose)
  purpose: ListingPurpose;

  @ApiProperty({ enum: PropertyType })
  @IsEnum(PropertyType)
  propertyType: PropertyType;

  @ApiProperty()
  @IsString()
  @MinLength(4)
  title: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  description: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty()
  @IsString()
  city: string;

  @ApiProperty()
  @IsString()
  area: string;

  @ApiProperty({
    required: false,
    description: 'Society/development name, e.g. "Bahria Town" — structured location (§03/1)',
  })
  @IsOptional()
  @IsString()
  societyName?: string;

  @ApiProperty({ required: false, description: 'Phase/sector within the society, e.g. "Phase 7"' })
  @IsOptional()
  @IsString()
  phaseName?: string;

  @ApiProperty({ required: false, description: 'Block within the phase, e.g. "Block C"' })
  @IsOptional()
  @IsString()
  blockName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  beds?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  baths?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sizeValue?: number;

  @ApiProperty({ required: false, example: 'marla' })
  @IsOptional()
  @IsString()
  sizeUnit?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  photoUrls?: string[];
}
