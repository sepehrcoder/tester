import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: '+923001234567' })
  @Matches(/^\+?[1-9]\d{7,14}$/)
  phone: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password: string;
}
