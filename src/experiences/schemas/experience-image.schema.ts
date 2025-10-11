import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { ExperienceType } from './experience-type.schema';

export type ExperienceImageDocument = HydratedDocument<ExperienceImage>;

@Schema({ timestamps: true })
export class ExperienceImage {
  @ApiProperty({
    description: 'Absolute URL for the experience image asset.',
    example: 'https://cdn.example.com/experiences/type-1/header.jpg',
  })
  @Prop({ type: String, required: true, trim: true })
  url!: string;

  @ApiProperty({
    description: 'Experience type associated with this image.',
    type: () => ExperienceType,
  })
  @Type(() => ExperienceType)
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: ExperienceType.name,
    required: true,
  })
  experienceType!: ExperienceType | Types.ObjectId;

  @ApiPropertyOptional({
    description: 'Optional display title for the image.',
    example: 'STEM Lab Banner',
    nullable: true,
  })
  @Prop({ type: String, default: null, trim: true })
  title?: string | null;

  @ApiPropertyOptional({
    description: 'Optional comma-separated tags describing the image.',
    example: 'science,lab,students',
    nullable: true,
  })
  @Prop({ type: String, default: null, trim: true })
  tags?: string | null;

  @ApiPropertyOptional({
    description: 'Indicates whether this is the default image for the type.',
    default: false,
  })
  @Prop({ type: Boolean, default: false })
  default!: boolean;
}

export const ExperienceImageSchema =
  SchemaFactory.createForClass(ExperienceImage);
