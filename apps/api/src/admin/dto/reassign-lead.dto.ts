import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ReassignLeadDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  dealerId: string;
}
