import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { HydratedDocument } from 'mongoose';

export type UniversityDocument = HydratedDocument<University>;

@Schema({ timestamps: true })
export class University {
  @ApiProperty({
    description: 'Unique identifier assigned to the institution.',
    example: '100654',
  })
  @Prop({ type: String, trim: true })
  united_id!: string;

  @ApiProperty({
    description: 'Official name of the institution.',
    example: 'Massachusetts Institute of Technology',
  })
  @Prop({ type: String, trim: true })
  instnm!: string;

  @ApiProperty({
    description: 'Primary street address of the campus.',
    example: '77 Massachusetts Ave',
  })
  @Prop({ type: String, trim: true })
  address!: string;

  @ApiProperty({
    description: 'City where the campus is located.',
    example: 'Cambridge',
  })
  @Prop({ type: String, trim: true })
  city!: string;

  @ApiProperty({
    description: 'Two-letter postal abbreviation of the state.',
    example: 'MA',
  })
  @Prop({ type: String, trim: true, uppercase: true })
  stabbr!: string;

  @ApiProperty({
    description: 'Five or nine digit postal ZIP code.',
    example: '02139',
  })
  @Prop({ type: String, trim: true })
  zip!: string;

  @ApiProperty({
    description: 'Primary website for the institution.',
    example: 'https://web.mit.edu',
  })
  @Prop({ type: String, trim: true })
  website!: string;

  @ApiProperty({
    description: 'County name where the campus resides.',
    example: 'Middlesex County',
  })
  @Prop({ type: String, trim: true })
  county_name!: string;

  @ApiProperty({
    description: 'Longitude coordinate of the main campus.',
    example: '-71.0921',
  })
  @Prop({ type: String, trim: true })
  longitude!: string;

  @ApiProperty({
    description: 'Latitude coordinate of the main campus.',
    example: '42.3601',
  })
  @Prop({ type: String, trim: true })
  latitude!: string;

  @ApiProperty({
    description: 'Indicates whether the institution is active in Gradegy.',
    default: true,
  })
  @Prop({ type: Boolean, default: true })
  active!: boolean;
}

export const UniversitySchema = SchemaFactory.createForClass(University);
