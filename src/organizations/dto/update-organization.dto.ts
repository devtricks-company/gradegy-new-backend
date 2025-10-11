import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsMongoId, ValidateIf } from 'class-validator';
import { CreateOrganizationDto } from './create-organization.dto';
import { OrganizationType } from '../schemas/organization.schema';

export class UpdateOrganizationDto extends PartialType(CreateOrganizationDto) {
  @ApiPropertyOptional({
    description:
      'Associated school district id when organization type is secondary.',
    example: '6512bd43d9caa6e02c990b0b',
  })
  @ValidateIf(
    (input: UpdateOrganizationDto) =>
      input.organization_type === OrganizationType.Secondary,
  )
  @IsMongoId()
  school_district?: string;

  @ApiPropertyOptional({
    description:
      'Associated university id when organization type is post-secondary.',
    example: '6512bd43d9caa6e02c990b0c',
  })
  @ValidateIf(
    (input: UpdateOrganizationDto) =>
      input.organization_type === OrganizationType.PostSecondary,
  )
  @IsMongoId()
  university?: string;
}
