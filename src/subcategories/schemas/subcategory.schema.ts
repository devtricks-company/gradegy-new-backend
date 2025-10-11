import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { HydratedDocument, Types } from 'mongoose';
import { Category } from '../../categories/schemas/category.schema';

export type SubcategoryDocument = HydratedDocument<Subcategory>;

@Schema({ timestamps: true })
export class Subcategory {
  @ApiProperty({
    description: 'Display name for the subcategory.',
    example: 'STEM Robotics',
  })
  @Prop({ type: String, required: true, trim: true })
  title!: string;

  @ApiProperty({
    description:
      'Identifier of the parent category this subcategory belongs to.',
    type: String,
    example: '6512bd43d9caa6e02c990b0d',
  })
  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: Category.name,
    index: true,
  })
  category!: Types.ObjectId;

  @ApiProperty({
    description: 'True when the subcategory supports localized rewards.',
    default: false,
  })
  @Prop({ type: Boolean, default: false })
  localize_reward!: boolean;

  @ApiProperty({
    description: 'True when the subcategory grants coin rewards.',
    default: false,
  })
  @Prop({ type: Boolean, default: false })
  coins!: boolean;

  @ApiProperty({
    description: 'True when the subcategory is available in the store.',
    default: false,
  })
  @Prop({ type: Boolean, default: false })
  store!: boolean;

  @ApiProperty({
    description: 'Controls whether the subcategory is active and visible.',
    default: true,
  })
  @Prop({ type: Boolean, default: true })
  is_active!: boolean;
}

export const SubcategorySchema = SchemaFactory.createForClass(Subcategory);
