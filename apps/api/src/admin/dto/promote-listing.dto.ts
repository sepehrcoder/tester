import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, Min } from 'class-validator';

export class PromoteListingDto {
  @ApiProperty({ enum: ['FEATURED', 'PREMIUM'] })
  @IsIn(['FEATURED', 'PREMIUM'])
  tier: 'FEATURED' | 'PREMIUM';

  @ApiProperty({ description: 'Promotion window length, in days' })
  @IsInt()
  @Min(1)
  days: number;
}
