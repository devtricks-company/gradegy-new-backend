import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateSubcategoryDto {
  @ApiProperty({
    description: 'Human-readable title for the subcategory.',
    example: 'Local Community Impact',
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    description: 'Identifier of the category this subcategory belongs to.',
    type: String,
    example: '6512bd43d9caa6e02c990b0d',
  })
  @IsMongoId()
  category!: string;

  @ApiPropertyOptional({
    description: 'Indicates if the subcategory uses localized rewards.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  localize_reward?: boolean;

  @ApiPropertyOptional({
    description: 'True when the subcategory grants coin rewards.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  coins?: boolean;

  @ApiPropertyOptional({
    description: 'True when the subcategory is available in the store.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  store?: boolean;

  @ApiPropertyOptional({
    description: 'Controls whether the subcategory is active and visible.',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
