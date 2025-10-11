import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HydratedDocument, Types } from 'mongoose';
import { Category } from '../../categories/schemas/category.schema';
import { Organization } from '../../organizations/schemas/organization.schema';
import { Project } from '../../projects/schemas/project.schema';
import { Subcategory } from '../../subcategories/schemas/subcategory.schema';
import { ExperienceType } from './experience-type.schema';

export type ExperienceDocument = HydratedDocument<Experience>;

export enum ExperienceCompletionType {
  Student = 'student',
  Photo = 'photo',
  Admin = 'admin',
  Link = 'link',
}

export enum ExperienceTimingType {
  DelayAfterPrevious = 'delay_after_previous',
  StartDateAndLength = 'start_date_and_length',
  DateRange = 'date_range',
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
    ref: ExperienceType.name,
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
    enum: ExperienceTimingType,
    enumName: 'ExperienceTimingType',
    description:
      'Determines how the experience availability window is calculated.',
    default: ExperienceTimingType.DateRange,
  })
  @Prop({
    type: String,
    enum: ExperienceTimingType,
    required: true,
    default: ExperienceTimingType.DateRange,
  })
  timing_type!: ExperienceTimingType;

  @ApiPropertyOptional({
    description:
      'Number of whole days to delay before showing the experience when timing_type is delay_after_previous.',
    minimum: 0,
    default: 0,
  })
  @Prop({ type: Number, min: 0, default: 0 })
  delay_days!: number;

  @ApiPropertyOptional({
    description:
      'Inclusive number of days the experience remains available for start_date_and_length timing.',
    minimum: 1,
  })
  @Prop({ type: Number, min: 1, default: undefined })
  length_days?: number;

  @ApiPropertyOptional({
    description:
      'Experience that must be satisfied before this one becomes available. When set the experience is considered a child.',
    type: String,
  })
  @Prop({
    type: Types.ObjectId,
    ref: Experience.name,
    default: undefined,
    index: true,
  })
  prerequisite?: Types.ObjectId;

  @ApiPropertyOptional({
    description:
      'Defines the ordering of experiences within a program. Lower numbers appear earlier.',
    default: 0,
  })
  @Prop({ type: Number, default: 0 })
  sequence!: number;

  @ApiPropertyOptional({
    description:
      'Require learners to complete the experience before the next delay can begin.',
    default: false,
  })
  @Prop({ type: Boolean, default: false })
  completion_required!: boolean;

  @ApiPropertyOptional({
    description:
      'When true, a delayed child experience tied to a dated parent ends when the parent ends.',
    default: false,
  })
  @Prop({ type: Boolean, default: false })
  end_with_parent!: boolean;

  @ApiPropertyOptional({
    description:
      'Calendar date when the experience becomes visible to learners.',
    example: '2025-09-01',
  })
  @Prop({ type: Date, default: undefined })
  start_date?: Date;

  @ApiPropertyOptional({
    description: '24-hour time when the experience unlocks on the start date.',
    example: '15:30',
  })
  @Prop({
    type: String,
    trim: true,
    default: undefined,
    validate: {
      validator: (value: string | undefined) =>
        value === undefined || EXPERIENCE_TIME_PATTERN.test(value),
      message: EXPERIENCE_TIME_FORMAT_ERROR,
    },
  })
  start_time?: string;

  @ApiPropertyOptional({
    description: 'Calendar date when the experience expires for learners.',
    example: '2025-09-30',
  })
  @Prop({ type: Date, default: undefined })
  end_date?: Date;

  @ApiPropertyOptional({
    description:
      '24-hour time on the end date when the experience moves to past due.',
    example: '23:59',
  })
  @Prop({
    type: String,
    trim: true,
    default: undefined,
    validate: {
      validator: (value: string | undefined) =>
        value === undefined || EXPERIENCE_TIME_PATTERN.test(value),
      message: EXPERIENCE_TIME_FORMAT_ERROR,
    },
  })
  end_time?: string;

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

ExperienceSchema.index(
  { organization: 1, sequence: 1 },
  { name: 'experience_sequence_order' },
);

ExperienceSchema.index(
  { prerequisite: 1 },
  { name: 'experience_prerequisite_lookup' },
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

  const timingType = doc.timing_type ?? ExperienceTimingType.DateRange;

  if (timingType === ExperienceTimingType.DelayAfterPrevious) {
    if (!Number.isInteger(doc.delay_days) || doc.delay_days < 0) {
      doc.invalidate(
        'delay_days',
        'delay_days must be a non-negative integer when timing_type is delay_after_previous.',
      );
    }
  } else if (timingType === ExperienceTimingType.StartDateAndLength) {
    if (!doc.start_date) {
      doc.invalidate(
        'start_date',
        'start_date is required when timing_type is start_date_and_length.',
      );
    }

    if (!doc.start_time) {
      doc.invalidate(
        'start_time',
        'start_time is required when timing_type is start_date_and_length.',
      );
    }

    if (
      doc.length_days === undefined ||
      !Number.isInteger(doc.length_days) ||
      doc.length_days < 1
    ) {
      doc.invalidate(
        'length_days',
        'length_days must be an integer >= 1 when timing_type is start_date_and_length.',
      );
    }

    if (doc.start_date && typeof doc.length_days === 'number') {
      const derivedEndDate = calculateInclusiveEndDate(
        doc.start_date,
        doc.length_days,
      );
      doc.end_date = derivedEndDate;
      if (!doc.end_time && doc.start_time) {
        doc.end_time = doc.start_time;
      }
    }
  } else if (timingType === ExperienceTimingType.DateRange) {
    if (!doc.start_date) {
      doc.invalidate(
        'start_date',
        'start_date is required when timing_type is date_range.',
      );
    }

    if (!doc.start_time) {
      doc.invalidate(
        'start_time',
        'start_time is required when timing_type is date_range.',
      );
    }

    if (!doc.end_date) {
      doc.invalidate(
        'end_date',
        'end_date is required when timing_type is date_range.',
      );
    }

    if (!doc.end_time) {
      doc.invalidate(
        'end_time',
        'end_time is required when timing_type is date_range.',
      );
    }
  }

  if (doc.start_date && doc.end_date && doc.end_date < doc.start_date) {
    doc.invalidate('end_date', 'end_date must be on or after start_date.');
  }

  if (doc.start_time && !EXPERIENCE_TIME_PATTERN.test(doc.start_time)) {
    doc.invalidate('start_time', EXPERIENCE_TIME_FORMAT_ERROR);
  }

  if (doc.end_time && !EXPERIENCE_TIME_PATTERN.test(doc.end_time)) {
    doc.invalidate('end_time', EXPERIENCE_TIME_FORMAT_ERROR);
  }

  next();
});

function calculateInclusiveEndDate(startDate: Date, lengthDays: number): Date {
  const result = new Date(startDate.getTime());
  const offset = Math.max(0, lengthDays - 1);
  result.setUTCDate(result.getUTCDate() + offset);
  return result;
}
