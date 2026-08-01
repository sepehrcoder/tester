import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateRentalUnitDto } from './create-rental-unit.dto';

export class UpdateRentalUnitDto extends PartialType(
  OmitType(CreateRentalUnitDto, ['floorNumber'] as const),
) {}
