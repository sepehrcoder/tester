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

  @ApiProperty({ enum: ['CUSTOMER', 'DEALER', 'COMPANY'] })
  @IsIn(['CUSTOMER', 'DEALER', 'COMPANY'])
  role: 'CUSTOMER' | 'DEALER' | 'COMPANY';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    required: false,
    description: 'Required when role is COMPANY — the agency name.',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  companyName?: string;
}
