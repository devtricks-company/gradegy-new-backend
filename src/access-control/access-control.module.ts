import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Category, CategorySchema } from '../categories/schemas/category.schema';
import { Organization, OrganizationSchema } from '../organizations/schemas/organization.schema';
import {
  Subcategory,
  SubcategorySchema,
} from '../subcategories/schemas/subcategory.schema';
import { SubcategoriesModule } from '../subcategories/subcategories.module';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { AccessControlController } from './access-control.controller';
import { AccessControlService } from './access-control.service';
import {
  UserAssignment,
  UserAssignmentSchema,
} from './schemas/user-assignment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserAssignment.name, schema: UserAssignmentSchema },
      { name: User.name, schema: UserSchema },
      { name: Organization.name, schema: OrganizationSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Subcategory.name, schema: SubcategorySchema },
    ]),
    SubcategoriesModule,
  ],
  controllers: [AccessControlController],
  providers: [AccessControlService],
  exports: [AccessControlService],
})
export class AccessControlModule {}


