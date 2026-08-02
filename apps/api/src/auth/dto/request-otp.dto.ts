import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

export class RequestOtpDto {
  @ApiProperty({ example: '+923001234567' })
  @Matches(/^\+?[1-9]\d{7,14}$/)
  phone: string;
}
