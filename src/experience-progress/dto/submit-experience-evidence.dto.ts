import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsMongoId,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from 'class-validator';

class EvidencePayloadDto {
  @ApiPropertyOptional({
    description:
      'Optional learner-provided note to contextualize the submission.',
    example: 'Uploaded the attendance sheet signed by the advisor.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;

  @ApiPropertyOptional({
    description: 'Optional supporting link that serves as evidence.',
    example: 'https://example.com/proof/123',
  })
  @IsOptional()
  @IsUrl()
  @MaxLength(2048)
  linkUrl?: string;

  @ApiPropertyOptional({
    description: 'Optional uploaded asset reference such as a CDN URL.',
    example: 'https://cdn.example.com/uploads/proof-123.jpg',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  photoUrl?: string;
}

export class SubmitExperienceEvidenceDto {
  @ApiProperty({
    description: 'Identifier of the learner submitting evidence.',
    example: '6512bd43d9caa6e02c990b0d',
  })
  @IsMongoId()
  userId!: string;

  @ApiPropertyOptional({
    description: 'Optional structured evidence payload.',
    type: EvidencePayloadDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => EvidencePayloadDto)
  evidence?: EvidencePayloadDto;

  @ApiPropertyOptional({
    description: 'Optional metadata bag for modality-specific payloads.',
    example: { score: 8, reflection: 'Had a great time mentoring.' },
  })
  @IsOptional()
  @IsObject()
  @IsNotEmpty()
  metadata?: Record<string, unknown>;
}
