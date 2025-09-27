import { PartialType } from '@nestjs/swagger';
import { CreateHighschoolDto } from './create-highschool.dto';

export class UpdateHighschoolDto extends PartialType(CreateHighschoolDto) {}
