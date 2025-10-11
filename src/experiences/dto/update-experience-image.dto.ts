import { PartialType } from '@nestjs/swagger';
import { CreateExperienceImageDto } from './create-experience-image.dto';

export class UpdateExperienceImageDto extends PartialType(
  CreateExperienceImageDto,
) {}
