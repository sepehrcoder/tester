import { PartialType } from '@nestjs/swagger';
import { CreatePlazaDto } from './create-plaza.dto';

export class UpdatePlazaDto extends PartialType(CreatePlazaDto) {}
