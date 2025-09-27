import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSchoolDistrictDto {
  @ApiProperty({
    description: 'Unique identifier issued to the district by the overseeing agency.',
    example: 'SD-12345',
  })
  @IsString()
  @IsNotEmpty()
  agencyId!: string;

  @ApiProperty({ description: 'Human-readable school district name.', example: 'Los Angeles Unified' })
  @IsString()
  @IsNotEmpty()
  agencyName!: string;

  @ApiProperty({ description: 'State where the district operates.', example: 'California' })
  @IsString()
  @IsNotEmpty()
  stateName!: string;

  @ApiProperty({
    description: 'Identifier assigned by the state-level agency.',
    example: 'CA-987654',
  })
  @IsString()
  @IsNotEmpty()
  stateAgencyId!: string;

  @ApiPropertyOptional({ description: 'Flag indicating if the district is active.', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
