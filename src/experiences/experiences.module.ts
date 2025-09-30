import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExperiencesController } from './experiences.controller';
import { ExperiencesService } from './experiences.service';
import { Experience, ExperienceSchema } from './schemas/experience.schema';
import { ExperienceType, ExperienceTypeSchema } from './schemas/experience-type.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Experience.name, schema: ExperienceSchema },
      {name:ExperienceType.name,schema:ExperienceTypeSchema}
    ]),
  ],
  controllers: [ExperiencesController],
  providers: [ExperiencesService],
  exports: [ExperiencesService],
})
export class ExperiencesModule {}
