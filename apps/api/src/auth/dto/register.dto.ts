import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: '+923001234567' })
  @Matches(/^\+?[1-9]\d{7,14}$/, {
    message: 'phone must be a valid E.164-ish number',
  })
  phone: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ enum: ['CUSTOMER', 'DEALER'] })
  @IsIn(['CUSTOMER', 'DEALER'])
  role: 'CUSTOMER' | 'DEALER';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;
}
