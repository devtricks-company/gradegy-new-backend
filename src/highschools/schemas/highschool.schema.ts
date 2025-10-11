import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { HydratedDocument } from 'mongoose';

export type HighschoolDocument = HydratedDocument<Highschool>;

@Schema({ timestamps: true })
export class Highschool {
  @ApiProperty({
    description: 'Official name of the high school.',
    example: 'Springfield High School',
  })
  @Prop({ type: String, trim: true })
  school_name!: string;

  @ApiProperty({
    description: 'State where the high school operates.',
    example: 'California',
  })
  @Prop({ type: String, trim: true })
  state_name!: string;

  @ApiProperty({
    description: 'Unique identifier assigned to the school.',
    example: 'SCH-123456',
  })
  @Prop({ type: String, trim: true })
  school_id!: string;

  @ApiProperty({
    description: 'Name of the managing agency.',
    example: 'California Department of Education',
  })
  @Prop({ type: String, trim: true })
  agency_name!: string;

  @ApiProperty({
    description: 'Unique identifier of the managing agency.',
    example: 'AGY-98765',
  })
  @Prop({ type: String, trim: true })
  agency_id!: string;

  @ApiProperty({
    description: 'Classification of the school (e.g., public, charter).',
    example: 'Public',
  })
  @Prop({ type: String, trim: true })
  school_type!: string;

  @ApiProperty({
    description: 'Educational level the school serves.',
    example: 'High School',
  })
  @Prop({ type: String, trim: true })
  school_level!: string;

  @ApiProperty({
    description: 'State-specific identifier for the school.',
    example: 'CA-HS-01234',
  })
  @Prop({ type: String, trim: true })
  school_state_id!: string;

  @ApiProperty({
    description:
      'Identifier assigned by the state agency overseeing the school.',
    example: 'CA-STATE-56789',
  })
  @Prop({ type: String, trim: true })
  state_agency_id!: string;

  @ApiProperty({
    description: 'Indicates whether the school is currently active.',
    default: true,
  })
  @Prop({ type: Boolean, default: true })
  is_active!: boolean;
}

export const HighschoolSchema = SchemaFactory.createForClass(Highschool);
