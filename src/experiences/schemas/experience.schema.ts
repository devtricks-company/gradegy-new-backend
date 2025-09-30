import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HydratedDocument, Types } from 'mongoose';
import { Category } from '../../categories/schemas/category.schema';
import { Organization } from '../../organizations/schemas/organization.schema';
import { Project } from '../../projects/schemas/project.schema';
import { Subcategory } from '../../subcategories/schemas/subcategory.schema';

export type ExperienceDocument = HydratedDocument<Experience>;

export enum ExperienceCompletionType {
  Student = 'student',
  Photo = 'photo',
  Admin = 'admin',
  Link = 'link',
}

export const EXPERIENCE_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
export const EXPERIENCE_TIME_FORMAT_ERROR =
  'Time must be in 24-hour HH:mm or HH:mm:ss format with leading zeros.';

@Schema({ timestamps: true })
export class Experience {
  @ApiProperty({
    description: 'Title displayed to learners for the experience.',
    example: 'Attend the STEM Club Kickoff',
  })
  @Prop({ type: String, required: true, trim: true })
  title!: string;

  @ApiPropertyOptional({
    description: 'Short supporting headline that clarifies the experience.',
    example: 'Join us after school for snacks and robotics demos.',
  })
  @Prop({ type: String, trim: true, default: '' })
  subtitle!: string;

  @ApiProperty({
    description: 'Full description of the experience, including requirements.',
    example:
      'Meet in Room 204 by 3:30 PM. Sign in with the advisor to receive credit.',
  })
  @Prop({ type: String, required: true, trim: true })
  description!: string;

  @ApiPropertyOptional({
    description: 'Primary image or illustration for the experience.',
    example: 'https://cdn.example.com/experiences/stem-kickoff.jpg',
  })
  @Prop({ type: String, trim: true, default: '' })
  image!: string;

  @ApiProperty({
    description: 'Identifier of the experience type that governs styling.',
    type: String,
    example: '6512bd43d9caa6e02c990b0d',
  })
  @Prop({
    type: Types.ObjectId,
    ref: 'ExperienceType',
    required: true,
  })
  experience_type!: Types.ObjectId;

  @ApiProperty({
    description: 'Organization whose members can access the experience.',
    type: String,
    example: '6512bd43d9caa6e02c990b0e',
  })
  @Prop({
    type: Types.ObjectId,
    ref: Organization.name,
    required: true,
    index: true,
  })
  organization!: Types.ObjectId;

  @ApiPropertyOptional({
    description:
      'Optional project scoping this experience to a project audience.',
    type: String,
    example: '6512bd43d9caa6e02c990b0f',
  })
  @Prop({
    type: Types.ObjectId,
    ref: Project.name,
    default: undefined,
    index: true,
  })
  project?: Types.ObjectId;

  @ApiPropertyOptional({
    description:
      'Optional category that narrows visibility for the experience.',
    type: String,
    example: '6512bd43d9caa6e02c990b10',
  })
  @Prop({
    type: Types.ObjectId,
    ref: Category.name,
    default: undefined,
    index: true,
  })
  category?: Types.ObjectId;

  @ApiPropertyOptional({
    description: 'Optional subcategory audience constraint.',
    type: String,
    example: '6512bd43d9caa6e02c990b11',
  })
  @Prop({
    type: Types.ObjectId,
    ref: Subcategory.name,
    default: undefined,
    index: true,
  })
  subcategory?: Types.ObjectId;

  @ApiProperty({
    description:
      'Calendar date when the experience becomes visible to learners.',
    example: '2025-09-01',
  })
  @Prop({ type: Date, required: true })
  start_date!: Date;

  @ApiProperty({
    description: '24-hour time when the experience unlocks on the start date.',
    example: '15:30',
  })
  @Prop({
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: (value: string) => EXPERIENCE_TIME_PATTERN.test(value),
      message: EXPERIENCE_TIME_FORMAT_ERROR,
    },
  })
  start_time!: string;

  @ApiProperty({
    description: 'Calendar date when the experience expires for learners.',
    example: '2025-09-30',
  })
  @Prop({ type: Date, required: true })
  end_date!: Date;

  @ApiProperty({
    description:
      '24-hour time on the end date when the experience moves to past due.',
    example: '23:59',
  })
  @Prop({
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: (value: string) => EXPERIENCE_TIME_PATTERN.test(value),
      message: EXPERIENCE_TIME_FORMAT_ERROR,
    },
  })
  end_time!: string;

  @ApiProperty({
    description: 'XP awarded when the learner submits the required evidence.',
    example: 50,
    minimum: 0,
  })
  @Prop({ type: Number, required: true, min: 0 })
  xp_completion!: number;

  @ApiProperty({
    description: 'XP awarded when the learner first views the experience.',
    example: 10,
    minimum: 0,
  })
  @Prop({ type: Number, required: true, min: 0 })
  xp_view!: number;

  @ApiProperty({
    description: 'Gems granted upon completing the experience.',
    example: 5,
    minimum: 0,
  })
  @Prop({ type: Number, required: true, min: 0 })
  gems!: number;

  @ApiProperty({
    enum: ExperienceCompletionType,
    enumName: 'ExperienceCompletionType',
    description: 'How the learner confirms completion of the experience.',
    example: ExperienceCompletionType.Student,
  })
  @Prop({
    type: String,
    enum: ExperienceCompletionType,
    required: true,
  })
  completion_type!: ExperienceCompletionType;

  @ApiPropertyOptional({
    description:
      'URL learners must visit to satisfy completion when completion_type is link.',
    example: 'https://example.com/submit-proof',
  })
  @Prop({ type: String, trim: true, default: undefined })
  complete_url?: string;

  @ApiProperty({
    description:
      'Automatically credit XPs and gems upon learner submission when true.',
    default: false,
  })
  @Prop({ type: Boolean, default: false })
  auto_complete!: boolean;

  @ApiPropertyOptional({
    description: 'Optional call-to-action label displayed beside the link URL.',
    example: 'View Resources',
  })
  @Prop({ type: String, trim: true, default: undefined })
  link_text?: string;

  @ApiPropertyOptional({
    description: 'Optional informational link that accompanies the experience.',
    example: 'https://example.com/resources',
  })
  @Prop({ type: String, trim: true, default: undefined })
  link_url?: string;
}

export const ExperienceSchema = SchemaFactory.createForClass(Experience);

ExperienceSchema.index(
  { organization: 1, project: 1, category: 1, subcategory: 1 },
  { name: 'experience_scope' },
);

ExperienceSchema.index(
  { start_date: 1, end_date: 1 },
  { name: 'experience_date_window' },
);

ExperienceSchema.pre('validate', function (next) {
  const doc = this as ExperienceDocument;

  if (
    doc.completion_type === ExperienceCompletionType.Link &&
    !doc.complete_url
  ) {
    doc.invalidate(
      'complete_url',
      'complete_url is required when completion_type is link.',
    );
  }

  if (doc.end_date < doc.start_date) {
    doc.invalidate('end_date', 'end_date must be on or after start_date.');
  }

  if (!EXPERIENCE_TIME_PATTERN.test(doc.start_time)) {
    doc.invalidate('start_time', EXPERIENCE_TIME_FORMAT_ERROR);
  }

  if (!EXPERIENCE_TIME_PATTERN.test(doc.end_time)) {
    doc.invalidate('end_time', EXPERIENCE_TIME_FORMAT_ERROR);
  }

  next();
});
