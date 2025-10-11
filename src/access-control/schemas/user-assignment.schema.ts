import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { HydratedDocument, Types } from 'mongoose';
import { Category } from '../../categories/schemas/category.schema';
import { Organization } from '../../organizations/schemas/organization.schema';
import { Project } from '../../projects/schemas/project.schema';
import { Subcategory } from '../../subcategories/schemas/subcategory.schema';
import { User } from '../../users/schemas/user.schema';

export type UserAssignmentDocument = HydratedDocument<UserAssignment>;

@Schema({ timestamps: true })
export class UserAssignment {
  @ApiPropertyOptional({
    description: 'User receiving delegated access rights.',
    type: String,
  })
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  user!: Types.ObjectId;

  @ApiPropertyOptional({
    description: 'Organization that scopes the assignment.',
    type: String,
  })
  @Prop({
    type: Types.ObjectId,
    ref: Organization.name,
    required: true,
    index: true,
  })
  organization!: Types.ObjectId;

  @ApiPropertyOptional({
    description: 'Project scope when assignment targets a project.',
    type: String,
  })
  @Prop({
    type: Types.ObjectId,
    ref: Project.name,
    default: undefined,
  })
  project?: Types.ObjectId;

  @ApiPropertyOptional({
    description: 'Category scope when assignment targets a category.',
    type: String,
  })
  @Prop({
    type: Types.ObjectId,
    ref: Category.name,
    default: undefined,
  })
  category?: Types.ObjectId;

  @ApiPropertyOptional({
    description: 'Subcategory scope when assignment targets a subcategory.',
    type: String,
  })
  @Prop({
    type: Types.ObjectId,
    ref: Subcategory.name,
    default: undefined,
  })
  subcategory?: Types.ObjectId;
}

export const UserAssignmentSchema =
  SchemaFactory.createForClass(UserAssignment);

UserAssignmentSchema.index(
  { user: 1, organization: 1, project: 1, category: 1, subcategory: 1 },
  { unique: true },
);
