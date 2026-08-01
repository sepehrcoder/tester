import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LinkOwnerDto {
  @ApiProperty({ example: '+923001234567' })
  @IsString()
  @MinLength(8)
  ownerPhone: string;
}
