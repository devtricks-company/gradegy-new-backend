import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class MarkExperienceViewedDto {
  @ApiProperty({
    description: 'Identifier of the learner who viewed the experience.',
    example: '6512bd43d9caa6e02c990b0d',
  })
  @IsMongoId()
  userId!: string;
}
