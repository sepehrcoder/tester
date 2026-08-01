import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { ListingStatus } from '../../../generated/prisma/enums';

export class ModerateListingDto {
  @ApiProperty({ enum: ListingStatus })
  @IsEnum(ListingStatus)
  status: ListingStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  verified?: boolean;
}
