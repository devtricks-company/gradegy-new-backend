import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExperienceTypesController } from './experience-types.controller';
import { ExperienceTypesService } from './experience-types.service';
import { ExperiencesController } from './experiences.controller';
import { ExperiencesService } from './experiences.service';
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
    ]),
  ],
  controllers: [ExperiencesController, ExperienceTypesController],
  providers: [ExperiencesService, ExperienceTypesService],
  exports: [ExperiencesService, ExperienceTypesService],
})
export class ExperiencesModule {}
