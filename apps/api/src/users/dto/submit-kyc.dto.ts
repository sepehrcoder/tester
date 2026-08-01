import { ApiProperty } from '@nestjs/swagger';
import { IsUrl } from 'class-validator';

export class SubmitKycDto {
  // Stubbed storage: this expects a URL to an already-uploaded document
  // (e.g. from a pre-signed upload step). No file storage is wired up yet —
  // see the "deployment" notes in the repo README.
  @ApiProperty()
  @IsUrl()
  documentUrl: string;
}
