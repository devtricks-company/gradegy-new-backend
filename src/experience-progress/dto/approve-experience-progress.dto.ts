import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class ApproveExperienceProgressDto {
  @ApiProperty({
    description: 'Identifier of the administrator approving the submission.',
    example: '6512bd43d9caa6e02c990c01',
  })
  @IsMongoId()
  adminId!: string;

  @ApiPropertyOptional({
    description: 'Override for the XP to award. Defaults to experience XP.',
    example: 50,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  xpAwarded?: number;

  @ApiPropertyOptional({
    description: 'Override for the gems to award. Defaults to experience gems.',
    example: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  gemsAwarded?: number;

  @ApiPropertyOptional({
    description: 'Optional message recorded along with the approval.',
    example: 'Approved during advisory period review.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reviewNote?: string;
}
