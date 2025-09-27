import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDefined,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { OrganizationType } from '../schemas/organization.schema';

export class CreateOrganizationDto {
  @ApiProperty({
    description: 'Full title displayed for the organization.',
    example: 'Springfield Unified School District',
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({
    description: 'Abbreviated title used in compact UI contexts.',
    example: 'Springfield USD',
  })
  @IsOptional()
  @IsString()
  short_title?: string;

  @ApiProperty({
    enum: OrganizationType,
    enumName: 'OrganizationType',
    description: 'Classification of the organization.',
    example: OrganizationType.Secondary,
  })
  @IsEnum(OrganizationType)
  organization_type!: OrganizationType;

  @ApiPropertyOptional({
    description: 'URL or key referencing the organization image.',
    example: 'https://cdn.example.com/orgs/springfield.png',
  })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({
    description: 'Indicates whether the organization is a UFCS member.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  ufcs_member?: boolean;

  @ApiProperty({
    description:
      'Identifier of the lead user contact responsible for the organization.',
    example: '6512bd43d9caa6e02c990b0a',
  })
  @IsMongoId()
  lead_contact!: string;

  @ApiProperty({
    description: 'Whether the organization has a paid subscription.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  paid?: boolean;

  @ApiProperty({
    description: 'Whether the reward system is enabled for the organization.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  reward_system?: boolean;

  @ApiProperty({
    description: 'Whether the survey system is enabled for the organization.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  survey_system?: boolean;

  @ApiPropertyOptional({
    description:
      'Associated school district id when organization type is secondary.',
    example: '6512bd43d9caa6e02c990b0b',
  })
  @ValidateIf(
    (input: CreateOrganizationDto) =>
      input.organization_type === OrganizationType.Secondary,
  )
  @IsDefined()
  @IsMongoId()
  school_district?: string;

  @ApiPropertyOptional({
    description:
      'Associated university id when organization type is post-secondary.',
    example: '6512bd43d9caa6e02c990b0c',
  })
  @ValidateIf(
    (input: CreateOrganizationDto) =>
      input.organization_type === OrganizationType.PostSecondary,
  )
  @IsDefined()
  @IsMongoId()
  university?: string;

  @ApiProperty({
    description: 'Flag indicating whether the organization is active.',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
