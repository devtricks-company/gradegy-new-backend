import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectExperienceProgressDto {
  @ApiProperty({
    description: 'Identifier of the administrator rejecting the submission.',
    example: '6512bd43d9caa6e02c990c01',
  })
  @IsMongoId()
  adminId!: string;

  @ApiPropertyOptional({
    description: 'Optional explanation visible to the learner.',
    example: 'Attendance sheet missing signature. Please resubmit.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reviewNote?: string;
}
