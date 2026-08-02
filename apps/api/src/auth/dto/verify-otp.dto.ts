import { ApiProperty } from '@nestjs/swagger';
import { Length, Matches } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({ example: '+923001234567' })
  @Matches(/^\+?[1-9]\d{7,14}$/)
  phone: string;

  @ApiProperty({ example: '123456' })
  @Length(6, 6)
  code: string;
}
