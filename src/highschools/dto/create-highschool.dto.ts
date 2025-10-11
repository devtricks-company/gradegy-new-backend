import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateHighschoolDto {
  @ApiProperty({
    description: 'Official name of the high school.',
    example: 'Springfield High School',
  })
  @IsString()
  @IsNotEmpty()
  school_name!: string;

  @ApiProperty({
    description: 'State where the high school operates.',
    example: 'California',
  })
  @IsString()
  @IsNotEmpty()
  state_name!: string;

  @ApiProperty({
    description: 'Unique identifier assigned to the school.',
    example: 'SCH-123456',
  })
  @IsString()
  @IsNotEmpty()
  school_id!: string;

  @ApiProperty({
    description: 'Name of the managing agency.',
    example: 'California Department of Education',
  })
  @IsString()
  @IsNotEmpty()
  agency_name!: string;

  @ApiProperty({
    description: 'Unique identifier of the managing agency.',
    example: 'AGY-98765',
  })
  @IsString()
  @IsNotEmpty()
  agency_id!: string;

  @ApiProperty({
    description: 'Classification of the school (e.g., public, charter).',
    example: 'Public',
  })
  @IsString()
  @IsNotEmpty()
  school_type!: string;

  @ApiProperty({
    description: 'Educational level the school serves.',
    example: 'High School',
  })
  @IsString()
  @IsNotEmpty()
  school_level!: string;

  @ApiProperty({
    description: 'State-specific identifier for the school.',
    example: 'CA-HS-01234',
  })
  @IsString()
  @IsNotEmpty()
  school_state_id!: string;

  @ApiProperty({
    description:
      'Identifier assigned by the state agency overseeing the school.',
    example: 'CA-STATE-56789',
  })
  @IsString()
  @IsNotEmpty()
  state_agency_id!: string;

  @ApiPropertyOptional({
    description: 'Indicates whether the school is currently active.',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
