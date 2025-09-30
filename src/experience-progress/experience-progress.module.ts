import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExperienceProgressController } from './experience-progress.controller';
import { ExperienceProgressService } from './experience-progress.service';
import {
  ExperienceProgress,
  ExperienceProgressSchema,
} from './schemas/experience-progress.schema';
import {
  Experience,
  ExperienceSchema,
} from '../experiences/schemas/experience.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ExperienceProgress.name, schema: ExperienceProgressSchema },
      { name: Experience.name, schema: ExperienceSchema },
    ]),
  ],
  controllers: [ExperienceProgressController],
  providers: [ExperienceProgressService],
  exports: [ExperienceProgressService],
})
export class ExperienceProgressModule {}
