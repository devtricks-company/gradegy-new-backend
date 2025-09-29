import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import {
  Organization,
  OrganizationSchema,
} from './schemas/organization.schema';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { Category, CategorySchema } from '../categories/schemas/category.schema';
import { Highschool, HighschoolSchema } from '../highschools/schemas/highschool.schema';
import {
  SchoolDistrict,
  SchoolDistrictSchema,
} from '../school-districts/schemas/school-district.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Organization.name, schema: OrganizationSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Highschool.name, schema: HighschoolSchema },
      { name: SchoolDistrict.name, schema: SchoolDistrictSchema },
    ]),
  ],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
