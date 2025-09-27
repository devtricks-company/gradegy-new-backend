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
  @Prop({ type: String, trim: true })
  firstName?: string;

  @Prop({ type: String, trim: true })
  lastName?: string;

  @Prop({
    type: String,
    lowercase: true,
    unique: true,
    sparse: true,
    trim: true,
  })
  email?: string;

  @Prop({ type: String })
  password?: string;

  @Prop({ type: String, unique: true, sparse: true })
  googleId?: string;

  @Prop({ type: String, unique: true, sparse: true })
  snapchatId?: string;

  @Prop({ type: String })
  avatarUrl?: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.Student })
  role!: UserRole;

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;

  @Prop({ type: Date })
  lastLoginAt?: Date;

  @Prop({ type: String })
  refreshTokenHash?: string;

  @Prop({ type: Date })
  refreshTokenExpiresAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
