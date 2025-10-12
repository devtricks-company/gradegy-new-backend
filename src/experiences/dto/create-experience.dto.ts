import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsISO8601,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateIf,
} from 'class-validator';
import {
  EXPERIENCE_TIME_PATTERN,
  ExperienceCompletionType,
  ExperienceDriverType,
  ExperienceTimingType,
} from '../schemas/experience.schema';

export class CreateExperienceDto {
  @ApiProperty({
    description: 'Title displayed to learners for the experience.',
    example: 'Attend the STEM Club Kickoff',
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({
    description: 'Short supporting headline that clarifies the experience.',
    example: 'Join us after school for snacks and robotics demos.',
  })
  @IsOptional()
  @IsString()
  subtitle?: string;

  @ApiProperty({
    description: 'Full description of the experience, including requirements.',
    example:
      'Meet in Room 204 by 3:30 PM. Sign in with the advisor to receive credit.',
  })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiPropertyOptional({
    description: 'Primary image or illustration for the experience.',
    example: 'https://cdn.example.com/experiences/stem-kickoff.jpg',
  })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({
    description: 'Identifier of the experience type that governs styling.',
    type: String,
    example: '6512bd43d9caa6e02c990b0d',
  })
  @IsMongoId()
  experience_type!: string;

  @ApiProperty({
    description: 'Organization whose members can access the experience.',
    type: String,
    example: '6512bd43d9caa6e02c990b0e',
  })
  @IsMongoId()
  organization!: string;

  @ApiPropertyOptional({
    description:
      'Optional project scoping this experience to a project audience.',
    type: String,
    example: '6512bd43d9caa6e02c990b0f',
  })
  @IsOptional()
  @IsMongoId()
  project?: string;

  @ApiPropertyOptional({
    description:
      'Optional category that narrows visibility for the experience.',
    type: String,
    example: '6512bd43d9caa6e02c990b10',
  })
  @IsOptional()
  @IsMongoId()
  category?: string;

  @ApiPropertyOptional({
    description: 'Optional subcategory audience constraint.',
    type: String,
    example: '6512bd43d9caa6e02c990b11',
  })
  @IsOptional()
  @IsMongoId()
  subcategory?: string;

  @ApiPropertyOptional({
    enum: ExperienceDriverType,
    enumName: 'ExperienceDriverType',
    description: 'Primary TAG driver associated with the experience.',
  })
  @IsOptional()
  @IsEnum(ExperienceDriverType)
  driver_one?: ExperienceDriverType;

  @ApiPropertyOptional({
    enum: ExperienceDriverType,
    enumName: 'ExperienceDriverType',
    description: 'Secondary TAG driver associated with the experience.',
  })
  @IsOptional()
  @IsEnum(ExperienceDriverType)
  driver_two?: ExperienceDriverType;

  @ApiProperty({
    enum: ExperienceTimingType,
    enumName: 'ExperienceTimingType',
    description:
      'Determines how the experience availability window is calculated.',
    default: ExperienceTimingType.DateRange,
  })
  @IsEnum(ExperienceTimingType)
  timing_type!: ExperienceTimingType;

  @ApiPropertyOptional({
    description:
      'Number of whole days to delay before showing a delay-after-previous experience.',
    minimum: 0,
    default: 0,
  })
  @ValidateIf(
    (dto: CreateExperienceDto) =>
      dto.timing_type === ExperienceTimingType.DelayAfterPrevious,
  )
  @IsInt()
  @Min(0)
  delay_days?: number;

  @ApiPropertyOptional({
    description:
      'Defines ordering of experiences. Lower numbers appear earlier.',
    default: 0,
  })
  @IsOptional()
  @IsInt()
  sequence?: number;

  @ApiPropertyOptional({
    description:
      'Experience that must be satisfied before this one becomes available.',
    type: String,
  })
  @IsOptional()
  @IsMongoId()
  prerequisite?: string;

  @ApiPropertyOptional({
    description:
      'Require completion before subsequent delayed experiences begin counting.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  completion_required?: boolean;

  @ApiPropertyOptional({
    description:
      'End this delay-after-previous child experience when the parent ends.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  end_with_parent?: boolean;

  @ApiPropertyOptional({
    description:
      'Calendar date when the experience becomes visible to learners.',
    example: '2025-09-01',
    format: 'date',
  })
  @ValidateIf(
    (dto: CreateExperienceDto) =>
      dto.timing_type === ExperienceTimingType.StartDateAndLength ||
      dto.timing_type === ExperienceTimingType.DateRange,
  )
  @IsISO8601()
  start_date?: string;

  @ApiPropertyOptional({
    description: '24-hour time when the experience unlocks on the start date.',
    example: '15:30',
  })
  @ValidateIf(
    (dto: CreateExperienceDto) =>
      dto.timing_type === ExperienceTimingType.StartDateAndLength ||
      dto.timing_type === ExperienceTimingType.DateRange,
  )
  @Matches(EXPERIENCE_TIME_PATTERN, {
    message:
      'start_time must be in 24-hour HH:mm or HH:mm:ss format with leading zeros.',
  })
  start_time?: string;

  @ApiPropertyOptional({
    description:
      'Inclusive number of days the experience remains available for start_date_and_length timing.',
    minimum: 1,
  })
  @ValidateIf(
    (dto: CreateExperienceDto) =>
      dto.timing_type === ExperienceTimingType.StartDateAndLength,
  )
  @IsInt()
  @Min(1)
  length_days?: number;

  @ApiPropertyOptional({
    description: 'Calendar date when the experience expires for learners.',
    example: '2025-09-30',
    format: 'date',
  })
  @ValidateIf(
    (dto: CreateExperienceDto) =>
      dto.timing_type === ExperienceTimingType.DateRange,
  )
  @IsISO8601()
  end_date?: string;

  @ApiPropertyOptional({
    description:
      '24-hour time on the end date when the experience moves to past due.',
    example: '23:59',
  })
  @ValidateIf(
    (dto: CreateExperienceDto) =>
      dto.timing_type === ExperienceTimingType.DateRange ||
      dto.timing_type === ExperienceTimingType.StartDateAndLength,
  )
  @Matches(EXPERIENCE_TIME_PATTERN, {
    message:
      'end_time must be in 24-hour HH:mm or HH:mm:ss format with leading zeros.',
  })
  end_time?: string;

  @ApiProperty({
    description: 'XP awarded when the learner submits the required evidence.',
    example: 50,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  xp_completion!: number;

  @ApiProperty({
    description: 'XP awarded when the learner first views the experience.',
    example: 10,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  xp_view!: number;

  @ApiProperty({
    description: 'Gems granted upon completing the experience.',
    example: 5,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  gems!: number;

  @ApiProperty({
    enum: ExperienceCompletionType,
    enumName: 'ExperienceCompletionType',
    description: 'How the learner confirms completion of the experience.',
    example: ExperienceCompletionType.Student,
  })
  @IsEnum(ExperienceCompletionType)
  completion_type!: ExperienceCompletionType;

  @ApiPropertyOptional({
    description:
      'URL learners must visit to satisfy completion when completion_type is link.',
    example: 'https://example.com/submit-proof',
  })
  @ValidateIf(
    (dto: CreateExperienceDto) =>
      dto.completion_type === ExperienceCompletionType.Link,
  )
  @IsString()
  @IsNotEmpty()
  complete_url?: string;

  @ApiPropertyOptional({
    description:
      'Automatically credit XPs and gems upon learner submission when true.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  auto_complete?: boolean;

  @ApiPropertyOptional({
    description: 'Optional call-to-action label displayed beside the link URL.',
    example: 'View Resources',
  })
  @IsOptional()
  @IsString()
  link_text?: string;

  @ApiPropertyOptional({
    description: 'Optional informational link that accompanies the experience.',
    example: 'https://example.com/resources',
  })
  @IsOptional()
  @IsString()
  link_url?: string;
}
