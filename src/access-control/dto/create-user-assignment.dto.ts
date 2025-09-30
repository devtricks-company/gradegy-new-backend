import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateUserAssignmentDto {
  @ApiProperty({
    description: 'Identifier of the user receiving the scoped assignment.',
    type: String,
  })
  @IsMongoId()
  @IsNotEmpty()
  user!: string;

  @ApiProperty({
    description: 'Organization that scopes the assignment.',
    type: String,
  })
  @IsMongoId()
  @IsNotEmpty()
  organization!: string;

  @ApiPropertyOptional({
    description: 'Optional project scope. Must belong to the organization when provided.',
    type: String,
  })
  @IsOptional()
  @IsMongoId()
  project?: string;

  @ApiPropertyOptional({
    description: 'Optional category scope. Requires a project that owns the category.',
    type: String,
  })
  @IsOptional()
  @IsMongoId()
  category?: string;

  @ApiPropertyOptional({
    description: 'Optional subcategory scope. Requires the category that owns it.',
    type: String,
  })
  @IsOptional()
  @IsMongoId()
  subcategory?: string;
}
