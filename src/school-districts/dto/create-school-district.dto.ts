import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSchoolDistrictDto {
  @ApiProperty({
    description: 'Unique identifier issued to the district by the overseeing agency.',
    example: 'SD-12345',
  })
  @IsString()
  @IsNotEmpty()
  agancy_id!: string;

  @ApiProperty({ description: 'Human-readable school district name.', example: 'Los Angeles Unified' })
  @IsString()
  @IsNotEmpty()
  agancy_name!: string;

  @ApiProperty({ description: 'State where the district operates.', example: 'California' })
  @IsString()
  @IsNotEmpty()
  state_name!: string;

  @ApiProperty({
    description: 'Identifier assigned by the state-level agency.',
    example: 'CA-987654',
  })
  @IsString()
  @IsNotEmpty()
  state_agancy_id!: string;

  @ApiPropertyOptional({ description: 'Flag indicating if the district is active.', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
