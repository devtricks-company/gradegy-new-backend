import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { HydratedDocument } from 'mongoose';

export type SchoolDistrictDocument = HydratedDocument<SchoolDistrict>;

@Schema({ timestamps: true })
export class SchoolDistrict {
  @ApiProperty({
    description:
      'Unique identifier issued to the district by the overseeing agency.',
    example: 'SD-12345',
  })
  @Prop({ type: String, trim: true })
  agancy_id: string;

  @ApiProperty({
    description: 'Human-readable school district name.',
    example: 'Los Angeles Unified',
  })
  @Prop({ type: String, trim: true })
  agancy_name: string;

  @ApiProperty({
    description: 'State where the district operates.',
    example: 'California',
  })
  @Prop({ type: String, trim: true })
  state_name: string;

  @ApiProperty({
    description: 'Identifier assigned by the state-level agency.',
    example: 'CA-987654',
  })
  @Prop({ type: String, trim: true })
  state_agancy_id: string;

  @ApiProperty({
    description: 'Flag indicating if the district is active.',
    default: true,
  })
  @Prop({ type: Boolean, default: true })
  isActive!: boolean;
}

export const SchoolDistrictSchema =
  SchemaFactory.createForClass(SchoolDistrict);
