import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SchoolDistrictsController } from './school-districts.controller';
import { SchoolDistrictsService } from './school-districts.service';
import {
  SchoolDistrict,
  SchoolDistrictSchema,
} from './schemas/school-district.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SchoolDistrict.name, schema: SchoolDistrictSchema },
    ]),
  ],
  controllers: [SchoolDistrictsController],
  providers: [SchoolDistrictsService],
  exports: [SchoolDistrictsService],
})
export class SchoolDistrictsModule {}
