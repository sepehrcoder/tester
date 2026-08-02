import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class JoinCompanyDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  inviteCode: string;
}
