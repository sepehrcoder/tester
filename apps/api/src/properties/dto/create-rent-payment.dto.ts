import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsUrl,
  Min,
} from 'class-validator';

export class CreateRentPaymentDto {
  @ApiProperty({
    description: 'Any date within the month this payment is for.',
  })
  @IsDateString()
  forMonth: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({
    required: false,
    description:
      'URL to a receipt/screenshot — no file storage yet, so a link.',
  })
  @IsOptional()
  @IsUrl()
  proofUrl?: string;
}
