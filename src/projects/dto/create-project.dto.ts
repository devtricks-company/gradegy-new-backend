import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDefined,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import {
  POST_SECONDARY_PROJECT_TYPES,
  ProjectCondition,
  ProjectStatus,
  ProjectType,
  SECONDARY_PROJECT_TYPES,
} from '../schemas/project.schema';

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

export class CreateProjectDto {
  @ApiProperty({
    description: 'Human-readable project title.',
    example: 'Freshman Orientation Redesign',
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({
    description: 'URL or storage key of the project image.',
    example: 'https://cdn.example.com/projects/project-123.png',
  })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({
    enum: ProjectType,
    enumName: 'ProjectType',
    default: ProjectType.SpecialProject,
    description: 'Classification of the project.',
  })
  @IsOptional()
  @IsEnum(ProjectType)
  project_type?: ProjectType;

  @ApiPropertyOptional({
    enum: ProjectCondition,
    enumName: 'ProjectCondition',
    default: ProjectCondition.Editable,
    description: 'Indicates if the project is editable or locked.',
  })
  @IsOptional()
  @IsEnum(ProjectCondition)
  condition?: ProjectCondition;

  @ApiPropertyOptional({
    enum: ProjectStatus,
    enumName: 'ProjectStatus',
    default: ProjectStatus.Active,
    description: 'Lifecycle status of the project.',
  })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional({
    description: 'True when the reward system is enabled for this project.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  reward_system?: boolean;

  @ApiPropertyOptional({
    description: 'True when the survey system is enabled for this project.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  survey_system?: boolean;

  @ApiProperty({
    description: 'Organizations that own or participate in the project.',
    type: [String],
    example: ['6512bd43d9caa6e02c990b0a'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  organizations!: string[];

  @ApiPropertyOptional({
    description:
      'Associated school district when the project targets secondary education.',
    example: '6512bd43d9caa6e02c990b0b',
  })
  @ValidateIf((dto: CreateProjectDto) =>
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
  @ValidateIf((dto: CreateProjectDto) =>
    isPostSecondaryProjectType(dto.project_type),
  )
  @IsDefined()
  @IsMongoId()
  university?: string;

  @ApiPropertyOptional({
    description: 'Indicates whether the project is active within the platform.',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
