import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HydratedDocument, Types } from 'mongoose';
import { Highschool } from '../../highschools/schemas/highschool.schema';
import { Project } from '../../projects/schemas/project.schema';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({ timestamps: true })
export class Category {
  @ApiProperty({
    description: 'Human-friendly category title that surfaces in the UI.',
    example: 'STEM Excellence',
  })
  @Prop({ type: String, required: true, trim: true })
  title!: string;

  @ApiPropertyOptional({
    description: 'Designated school level for which the category applies.',
    example: 'High School',
  })
  @Prop({ type: String, trim: true, default: undefined })
  school_level?: string;

  @ApiProperty({
    description: 'Indicates if the category awards localized recognitions.',
    default: false,
  })
  @Prop({ type: Boolean, default: false })
  localize_award!: boolean;

  @ApiProperty({
    description: 'True when the category grants coin rewards.',
    default: false,
  })
  @Prop({ type: Boolean, default: false })
  coins!: boolean;

  @ApiProperty({
    description: 'True when the category enables store redemption.',
    default: false,
  })
  @Prop({ type: Boolean, default: false })
  store!: boolean;

  @ApiProperty({
    description: 'Controls whether projects are displayed for the category.',
    default: false,
  })
  @Prop({ type: Boolean, default: false })
  display_project!: boolean;

  @ApiProperty({
    description: 'Flag reflecting whether the category is active.',
    default: true,
  })
  @Prop({ type: Boolean, default: true })
  is_active!: boolean;

  @ApiProperty({
    description: 'Reference to the project that owns the category.',
    type: String,
    example: '6512bd43d9caa6e02c990b0d',
  })
  @Prop({
    type: Types.ObjectId,
    ref: Project.name,
    required: true,
  })
  project!: Types.ObjectId;

  @ApiPropertyOptional({
    description: 'Associated highschool when the category targets a specific school.',
    type: String,
    example: '6512bd43d9caa6e02c990b0e',
  })
  @Prop({
    type: Types.ObjectId,
    ref: Highschool.name,
    default: undefined,
  })
  highschool?: Types.ObjectId;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
