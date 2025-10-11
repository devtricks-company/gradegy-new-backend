import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HydratedDocument, Types } from 'mongoose';
import { SchoolDistrict } from '../../school-districts/schemas/school-district.schema';
import { User } from '../../users/schemas/user.schema';

export type OrganizationDocument = HydratedDocument<Organization>;

export enum OrganizationType {
  Secondary = 'secondary',
  PostSecondary = 'post_secondary',
  Cbo = 'cbo',
  Other = 'other',
}

@Schema({ timestamps: true })
export class Organization {
  @ApiProperty({
    description: 'Full title displayed for the organization.',
    example: 'Springfield Unified School District',
  })
  @Prop({ type: String, required: true, trim: true })
  title!: string;

  @ApiPropertyOptional({
    description: 'Abbreviated title used in compact UIs.',
    example: 'Springfield USD',
  })
  @Prop({ type: String, default: null, trim: true })
  short_title?: string | null;

  @ApiProperty({
    enum: OrganizationType,
    enumName: 'OrganizationType',
    description: 'Classification of the organization.',
    example: OrganizationType.Secondary,
  })
  @Prop({ required: true, type: String, enum: OrganizationType })
  organization_type!: OrganizationType;

  @ApiPropertyOptional({
    description: 'URL of the organization logo or representative image.',
    example: 'https://cdn.example.com/orgs/springfield.png',
  })
  @Prop({ type: String, trim: true })
  image?: string;

  @ApiProperty({
    description: 'Indicates whether the organization is a UFCS member.',
    default: false,
  })
  @Prop({ default: false, type: Boolean })
  ufcs_member!: boolean;

  @ApiProperty({
    description: 'Reference to the user who serves as the primary contact.',
    type: String,
    example: '6512bd43d9caa6e02c990b0a',
  })
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  lead_contact!: Types.ObjectId;

  @ApiProperty({
    description: 'Whether the organization has an active paid plan.',
    default: false,
  })
  @Prop({ default: false, type: Boolean })
  paid!: boolean;

  @ApiProperty({
    description: 'Whether the organization has the reward system enabled.',
    default: false,
  })
  @Prop({ default: false, type: Boolean })
  reward_system!: boolean;

  @ApiProperty({
    description: 'Whether the organization has the survey system enabled.',
    default: false,
  })
  @Prop({ default: false, type: Boolean })
  survey_system!: boolean;

  @ApiPropertyOptional({
    description: 'Linked school district when organization type is secondary.',
    type: String,
    example: '6512bd43d9caa6e02c990b0b',
  })
  @Prop({
    type: Types.ObjectId,
    ref: SchoolDistrict.name,
    default: undefined,
  })
  school_district?: Types.ObjectId;

  @ApiPropertyOptional({
    description: 'Linked university when organization type is post-secondary.',
    type: String,
    example: '6512bd43d9caa6e02c990b0c',
  })
  @Prop({ type: Types.ObjectId, ref: 'University', default: undefined })
  university?: Types.ObjectId;

  @ApiProperty({
    description: 'Flag indicating whether the organization is active.',
    default: true,
  })
  @Prop({ default: true, required: true, type: Boolean })
  is_active!: boolean;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);
