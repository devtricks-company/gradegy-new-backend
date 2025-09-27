import { PartialType } from '@nestjs/swagger';
import { CreateSchoolDistrictDto } from './create-school-district.dto';

export class UpdateSchoolDistrictDto extends PartialType(CreateSchoolDistrictDto) {}
