import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsDefined, IsMongoId, ValidateIf } from 'class-validator';
import {
  POST_SECONDARY_PROJECT_TYPES,
  ProjectType,
  SECONDARY_PROJECT_TYPES,
} from '../schemas/project.schema';
import { CreateProjectDto } from './create-project.dto';

const SECONDARY_TYPE_SET = new Set<ProjectType>(SECONDARY_PROJECT_TYPES);
const POST_SECONDARY_TYPE_SET = new Set<ProjectType>(
  POST_SECONDARY_PROJECT_TYPES,
);

function isSecondaryProjectType(projectType?: ProjectType): boolean {
  if (!projectType) {
    return false;
  }
  return SECONDARY_TYPE_SET.has(projectType);
}

function isPostSecondaryProjectType(projectType?: ProjectType): boolean {
  if (!projectType) {
    return false;
  }
  return POST_SECONDARY_TYPE_SET.has(projectType);
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {
  @ApiPropertyOptional({
    description:
      'Associated school district when the project targets secondary education.',
    example: '6512bd43d9caa6e02c990b0b',
  })
  @ValidateIf((dto: UpdateProjectDto) =>
    isSecondaryProjectType(dto.project_type),
  )
  @IsDefined()
  @IsMongoId()
  school_district?: string;

  @ApiPropertyOptional({
    description:
      'Associated university when the project targets post-secondary education.',
    example: '6512bd43d9caa6e02c990b0c',
  })
  @ValidateIf((dto: UpdateProjectDto) =>
    isPostSecondaryProjectType(dto.project_type),
  )
  @IsDefined()
  @IsMongoId()
  university?: string;
}
