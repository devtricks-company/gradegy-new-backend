import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { Category } from '../../categories/schemas/category.schema';
import {
  Experience,
  ExperienceCompletionType,
} from '../../experiences/schemas/experience.schema';
import { Organization } from '../../organizations/schemas/organization.schema';
import { Project } from '../../projects/schemas/project.schema';
import { Subcategory } from '../../subcategories/schemas/subcategory.schema';
import { User } from '../../users/schemas/user.schema';

export type ExperienceProgressDocument = HydratedDocument<ExperienceProgress>;

export enum ExperienceProgressStatus {
  NotStarted = 'not_started',
  Viewed = 'viewed',
  EvidenceSubmitted = 'evidence_submitted',
  Completed = 'completed',
  Rejected = 'rejected',
}

@Schema({ _id: false })
export class ExperienceEvidence {
  @ApiPropertyOptional({
    description: 'Optional learner-provided note or reflection.',
    example: 'Attended the session and met with the mentor.',
  })
  @Prop({ type: String, trim: true })
  note?: string;

  @ApiPropertyOptional({
    description: 'Optional link that supports completion evidence.',
    example: 'https://example.com/completion-proof',
  })
  @Prop({ type: String, trim: true })
  linkUrl?: string;

  @ApiPropertyOptional({
    description: 'Optional uploaded asset reference (photo, document, etc.).',
    example: 'https://cdn.example.com/uploads/proof-123.jpg',
  })
  @Prop({ type: String, trim: true })
  photoUrl?: string;
}

export const ExperienceEvidenceSchema =
  SchemaFactory.createForClass(ExperienceEvidence);

@Schema({ timestamps: true })
export class ExperienceProgress {
  @ApiProperty({
    description: 'Experience that this progress entry tracks.',
    type: String,
  })
  @Prop({
    type: Types.ObjectId,
    ref: Experience.name,
    required: true,
    index: true,
  })
  experience!: Types.ObjectId;

  @ApiProperty({
    description: 'Learner associated with the tracked experience.',
    type: String,
  })
  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: true,
    index: true,
  })
  user!: Types.ObjectId;

  @ApiProperty({
    description: 'Owning organization scoped from the experience.',
    type: String,
  })
  @Prop({
    type: Types.ObjectId,
    ref: Organization.name,
    required: true,
    index: true,
  })
  organization!: Types.ObjectId;

  @ApiPropertyOptional({
    description: 'Project copied from the experience scope.',
    type: String,
  })
  @Prop({
    type: Types.ObjectId,
    ref: Project.name,
  })
  project?: Types.ObjectId;

  @ApiPropertyOptional({
    description: 'Category copied from the experience scope.',
    type: String,
  })
  @Prop({
    type: Types.ObjectId,
    ref: Category.name,
  })
  category?: Types.ObjectId;

  @ApiPropertyOptional({
    description: 'Subcategory copied from the experience scope.',
    type: String,
  })
  @Prop({
    type: Types.ObjectId,
    ref: Subcategory.name,
  })
  subcategory?: Types.ObjectId;

  @ApiProperty({
    enum: ExperienceProgressStatus,
    enumName: 'ExperienceProgressStatus',
    default: ExperienceProgressStatus.NotStarted,
    description: 'Current stage of the learner progress.',
  })
  @Prop({
    type: String,
    enum: ExperienceProgressStatus,
    default: ExperienceProgressStatus.NotStarted,
  })
  status!: ExperienceProgressStatus;

  @ApiProperty({
    enum: ExperienceCompletionType,
    enumName: 'ExperienceCompletionType',
    description: 'Snapshot of completion type at the time of creation.',
  })
  @Prop({
    type: String,
    enum: ExperienceCompletionType,
    required: true,
  })
  completionTypeSnapshot!: ExperienceCompletionType;

  @ApiProperty({
    description: 'True when the experience was configured for auto completion.',
    default: false,
  })
  @Prop({ type: Boolean, default: false })
  autoComplete!: boolean;

  @ApiProperty({
    description: 'XP amount actually awarded to the learner.',
    minimum: 0,
    default: 0,
  })
  @Prop({ type: Number, min: 0, default: 0 })
  xpAwarded!: number;

  @ApiProperty({
    description: 'Gems amount actually awarded to the learner.',
    minimum: 0,
    default: 0,
  })
  @Prop({ type: Number, min: 0, default: 0 })
  gemsAwarded!: number;

  @ApiPropertyOptional({
    description: 'Date when the learner first viewed the experience.',
  })
  @Prop({ type: Date })
  viewedAt?: Date;

  @ApiPropertyOptional({
    description: 'Date when the learner submitted completion evidence.',
  })
  @Prop({ type: Date })
  submittedAt?: Date;

  @ApiPropertyOptional({
    description: 'Date when progress moved to completed.',
  })
  @Prop({ type: Date })
  completedAt?: Date;

  @ApiPropertyOptional({
    description: 'Date when a submission was rejected by an administrator.',
  })
  @Prop({ type: Date })
  rejectedAt?: Date;

  @ApiPropertyOptional({
    description: 'Administrator who reviewed the submission.',
    type: String,
  })
  @Prop({ type: Types.ObjectId, ref: User.name })
  adminReviewer?: Types.ObjectId;

  @ApiPropertyOptional({
    description: 'Optional note left by the reviewer.',
  })
  @Prop({ type: String, trim: true })
  reviewNote?: string;

  @ApiPropertyOptional({
    description: 'Evidence payload supplied by the learner.',
  })
  @Prop({ type: ExperienceEvidenceSchema })
  evidence?: ExperienceEvidence;

  @ApiPropertyOptional({
    description: 'Flexible metadata for specialized completion payloads.',
  })
  @Prop({ type: Map, of: MongooseSchema.Types.Mixed })
  metadata?: Map<string, unknown>;
}

export const ExperienceProgressSchema =
  SchemaFactory.createForClass(ExperienceProgress);

ExperienceProgressSchema.index(
  { user: 1, experience: 1 },
  { unique: true, name: 'experience_progress_user_experience' },
);

ExperienceProgressSchema.index(
  { experience: 1, status: 1 },
  { name: 'experience_progress_by_experience_status' },
);

ExperienceProgressSchema.index(
  { user: 1, status: 1 },
  { name: 'experience_progress_by_user_status' },
);

ExperienceProgressSchema.index(
  { organization: 1, status: 1 },
  { name: 'experience_progress_by_org_status' },
);
