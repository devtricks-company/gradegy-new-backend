import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum UserRole {
  Ultra = 'ultra',
  Super = 'super',
  Admin = 'admin',
  Student = 'student',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ type: Boolean, required: true })
  first_name!: boolean;

  @Prop({ type: Boolean, required: true })
  last_name!: boolean;

  @Prop({ type: Boolean, required: true })
  email!: boolean;

  @Prop({ type: String })
  password?: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.Student })
  role!: UserRole;

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
