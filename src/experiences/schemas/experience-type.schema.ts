import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { HydratedDocument } from 'mongoose';

export type ExperienceTypeDocument = HydratedDocument<ExperienceType>;

@Schema({ timestamps: true })
export class ExperienceType {
  @ApiProperty({
    description: 'Human-friendly label shown wherever the experience type appears.',
    example: 'Workshop',
  })
  @Prop({ type: String, required: true, trim: true })
  title!: string;

  @ApiProperty({
    description: 'Hex color used to visually distinguish the experience type.',
    example: '#2563EB',
  })
  @Prop({ type: String, required: true, trim: true })
  color!: string;

  @ApiProperty({
    description: 'Icon identifier or asset URL tied to the experience type.',
    example: 'heroicons-outline:academic-cap',
  })
  @Prop({ type: String, required: true, trim: true })
  icon!: string;
}

export const ExperienceTypeSchema = SchemaFactory.createForClass(ExperienceType);
