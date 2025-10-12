import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export class CreateExperienceImageDto {
  @ApiProperty({
    description: 'Absolute URL pointing to the experience image asset.',
    example: 'https://cdn.example.com/images/experience-types/workshop.png',
  })
  @IsUrl({ require_tld: false })
  @IsNotEmpty()
  url!: string;

  @ApiProperty({
    description: 'Identifier of the experience type that owns this image.',
    type: String,
    example: '6512bd43d9caa6e02c990b0d',
  })
  @IsMongoId()
  experienceType!: string;

  @ApiPropertyOptional({
    description: 'Optional display title for the image.',
    example: 'Workshop hero banner',
  })
  @IsOptional()
  @IsString()
  title?: string | null;

  @ApiPropertyOptional({
    description: 'Optional comma-separated tags to help search images.',
    example: 'workshop,steam,students',
  })
  @IsOptional()
  @IsString()
  tags?: string | null;

  @ApiPropertyOptional({
    description:
      'Marks the image as the default choice for the experience type.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  default?: boolean;
}
