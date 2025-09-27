import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Human-friendly category title that surfaces in the UI.',
    example: 'STEM Excellence',
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({
    description: 'Designated school level for which the category applies.',
    example: 'High School',
  })
  @IsOptional()
  @IsString()
  school_level?: string;

  @ApiPropertyOptional({
    description: 'Indicates if the category awards localized recognitions.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  localize_award?: boolean;

  @ApiPropertyOptional({
    description: 'True when the category grants coin rewards.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  coins?: boolean;

  @ApiPropertyOptional({
    description: 'True when the category enables store redemption.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  store?: boolean;

  @ApiPropertyOptional({
    description: 'Controls whether projects are displayed for the category.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  display_project?: boolean;

  @ApiPropertyOptional({
    description: 'Flag reflecting whether the category is active.',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiProperty({
    description: 'Reference to the project that owns the category.',
    type: String,
    example: '6512bd43d9caa6e02c990b0d',
  })
  @IsMongoId()
  project!: string;

  @ApiPropertyOptional({
    description: 'Associated highschool when the category targets a specific school.',
    type: String,
    example: '6512bd43d9caa6e02c990b0e',
  })
  @IsOptional()
  @IsMongoId()
  highschool?: string;
}
