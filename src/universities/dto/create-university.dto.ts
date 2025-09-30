import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export class CreateUniversityDto {
  @ApiProperty({
    description: 'Unique identifier assigned to the institution.',
    example: '100654',
  })
  @IsString()
  @IsNotEmpty()
  united_id!: string;

  @ApiProperty({
    description: 'Official name of the institution.',
    example: 'Massachusetts Institute of Technology',
  })
  @IsString()
  @IsNotEmpty()
  instnm!: string;

  @ApiProperty({
    description: 'Primary street address of the campus.',
    example: '77 Massachusetts Ave',
  })
  @IsString()
  @IsNotEmpty()
  address!: string;

  @ApiProperty({
    description: 'City where the campus is located.',
    example: 'Cambridge',
  })
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiProperty({
    description: 'Two-letter postal abbreviation of the state.',
    example: 'MA',
  })
  @IsString()
  @IsNotEmpty()
  stabbr!: string;

  @ApiProperty({
    description: 'Five or nine digit postal ZIP code.',
    example: '02139',
  })
  @IsString()
  @IsNotEmpty()
  zip!: string;

  @ApiProperty({
    description: 'Primary website for the institution.',
    example: 'https://web.mit.edu',
  })
  @IsUrl()
  website!: string;

  @ApiProperty({
    description: 'County name where the campus resides.',
    example: 'Middlesex County',
  })
  @IsString()
  @IsNotEmpty()
  county_name!: string;

  @ApiProperty({
    description: 'Longitude coordinate of the main campus.',
    example: '-71.0921',
  })
  @IsString()
  @IsNotEmpty()
  longitude!: string;

  @ApiProperty({
    description: 'Latitude coordinate of the main campus.',
    example: '42.3601',
  })
  @IsString()
  @IsNotEmpty()
  latitude!: string;

  @ApiPropertyOptional({
    description: 'Indicates whether the institution is active in Gradegy.',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
