import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HydratedDocument, Types } from 'mongoose';
import { Organization } from '../../organizations/schemas/organization.schema';
import { SchoolDistrict } from '../../school-districts/schemas/school-district.schema';

export type ProjectDocument = HydratedDocument<Project>;

export enum ProjectType {
  SchoolDistrict = 'school_district',
  University = 'university',
  SpecialProject = 'special_project',

  OtherSecondary = 'other-secondary',
  OtherPostSecondary = 'other-post_secondary',
}

export enum ProjectCondition {
  Editable = 'editable',
  Locked = 'locked',
}

export enum ProjectStatus {
  Active = 'active',
  Stasis = 'stasis',
  Completed = 'completed',
}

export const SECONDARY_PROJECT_TYPES: readonly ProjectType[] = [
  ProjectType.SchoolDistrict,

  ProjectType.OtherSecondary,
];

export const POST_SECONDARY_PROJECT_TYPES: readonly ProjectType[] = [
  ProjectType.University,
  ProjectType.OtherPostSecondary,
];

const UNIVERSITY_MODEL_NAME = 'University';

@Schema({ timestamps: true })
export class Project {
  @ApiProperty({
    description: 'Human-readable project title.',
    example: 'Freshman Orientation Redesign',
  })
  @Prop({ type: String, required: true, trim: true })
  title!: string;

  @ApiPropertyOptional({
    description: 'URL or storage key of the project image.',
    example: 'https://cdn.example.com/projects/project-123.png',
  })
  @Prop({ type: String, default: '', trim: true })
  image!: string;

  @ApiProperty({
    enum: ProjectType,
    enumName: 'ProjectType',
    default: ProjectType.SpecialProject,
    description: 'Specifies the classification of the project.',
  })
  @Prop({
    required: true,
    type: String,
    enum: ProjectType,
    default: ProjectType.SpecialProject,
  })
  project_type!: ProjectType;

  @ApiProperty({
    enum: ProjectCondition,
    enumName: 'ProjectCondition',
    default: ProjectCondition.Editable,
    description: 'Indicates whether the project can still be modified.',
  })
  @Prop({
    required: true,
    type: String,
    enum: ProjectCondition,
    default: ProjectCondition.Editable,
  })
  condition!: ProjectCondition;

  @ApiProperty({
    enum: ProjectStatus,
    enumName: 'ProjectStatus',
    default: ProjectStatus.Active,
    description: 'Current lifecycle state of the project.',
  })
  @Prop({
    required: true,
    type: String,
    enum: ProjectStatus,
    default: ProjectStatus.Active,
  })
  status!: ProjectStatus;

  @ApiProperty({
    description: 'True when the reward system is enabled for this project.',
    default: false,
  })
  @Prop({ type: Boolean, default: false })
  reward_system!: boolean;

  @ApiProperty({
    description: 'True when the survey system is enabled for this project.',
    default: false,
  })
  @Prop({ type: Boolean, default: false })
  survey_system!: boolean;

  @ApiProperty({
    description: 'Organizations that own or participate in the project.',
    type: [String],
  })
  @Prop({
    required: true,
    type: [{ type: Types.ObjectId, ref: Organization.name }],
    validate: {
      validator: (value: Types.ObjectId[]) =>
        Array.isArray(value) && value.length > 0,
      message: 'A project must belong to at least one organization.',
    },
  })
  organizations!: Types.ObjectId[];

  @ApiProperty({
    description: 'Indicates whether the project is active within the platform.',
    default: true,
  })
  @Prop({ type: Boolean, default: true })
  is_active!: boolean;

  @ApiPropertyOptional({
    description:
      'Associated school district when the project targets secondary education.',
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
    description:
      'Associated university when the project targets post-secondary education.',
    type: String,
    example: '6512bd43d9caa6e02c990b0c',
  })
  @Prop({
    type: Types.ObjectId,
    ref: UNIVERSITY_MODEL_NAME,
    default: undefined,
  })
  university?: Types.ObjectId;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
