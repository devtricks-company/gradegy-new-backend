import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AccessControlModule } from '../access-control/access-control.module';
import { ExperienceImagesController } from './experience-images.controller';
import { ExperienceImagesService } from './experience-images.service';
import { ExperienceTypesController } from './experience-types.controller';
import { ExperienceTypesService } from './experience-types.service';
import { ExperiencesController } from './experiences.controller';
import { ExperiencesService } from './experiences.service';
import {
  ExperienceImage,
  ExperienceImageSchema,
} from './schemas/experience-image.schema';
import { Experience, ExperienceSchema } from './schemas/experience.schema';
import {
  ExperienceType,
  ExperienceTypeSchema,
} from './schemas/experience-type.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Experience.name, schema: ExperienceSchema },
      { name: ExperienceType.name, schema: ExperienceTypeSchema },
      { name: ExperienceImage.name, schema: ExperienceImageSchema },
    ]),
    AccessControlModule,
  ],
  controllers: [
    ExperiencesController,
    ExperienceTypesController,
    ExperienceImagesController,
  ],
  providers: [
    ExperiencesService,
    ExperienceTypesService,
    ExperienceImagesService,
  ],
  exports: [
    ExperiencesService,
    ExperienceTypesService,
    ExperienceImagesService,
  ],
})
export class ExperiencesModule {}
