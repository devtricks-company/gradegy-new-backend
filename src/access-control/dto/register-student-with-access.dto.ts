import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEmail,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RegisterStudentProfileDto {
  @ApiPropertyOptional({
    description: 'Student given name.',
    example: 'Dana',
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Student family name.',
    example: 'Azarbashi',
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({
    description: 'Student email address.',
    example: 'student@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Plain text password used for initial login.',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({
    description: 'Contact phone number.',
    example: '+1-555-123-4567',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Optional avatar image URL.',
    example: 'https://example.com/avatar.png',
  })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  avatarUrl?: string;

  @ApiPropertyOptional({
    description: 'Whether the student account should be active.',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class RegisterStudentAssignmentDto {
  @ApiProperty({
    description: 'Organization that scopes the assignment.',
    type: String,
  })
  @IsMongoId()
  @IsNotEmpty()
  organization!: string;

  @ApiPropertyOptional({
    description:
      'Optional project scope. Must belong to the selected organization.',
    type: String,
  })
  @IsOptional()
  @IsMongoId()
  project?: string;

  @ApiPropertyOptional({
    description:
      'Optional category scope. Requires a project that owns the category.',
    type: String,
  })
  @IsOptional()
  @IsMongoId()
  category?: string;

  @ApiPropertyOptional({
    description:
      'Optional subcategory scope. Requires the category that owns it.',
    type: String,
  })
  @IsOptional()
  @IsMongoId()
  subcategory?: string;
}

export class RegisterStudentWithAccessDto {
  @ApiProperty({
    description: 'Student profile and credentials.',
    type: RegisterStudentProfileDto,
  })
  @ValidateNested()
  @Type(() => RegisterStudentProfileDto)
  student!: RegisterStudentProfileDto;

  @ApiProperty({
    description: 'Access control assignments granted to the student.',
    type: [RegisterStudentAssignmentDto],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => RegisterStudentAssignmentDto)
  assignments!: RegisterStudentAssignmentDto[];
}
