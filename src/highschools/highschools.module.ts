import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HighschoolsController } from './highschools.controller';
import { HighschoolsService } from './highschools.service';
import { Highschool, HighschoolSchema } from './schemas/highschool.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Highschool.name, schema: HighschoolSchema },
    ]),
  ],
  controllers: [HighschoolsController],
  providers: [HighschoolsService],
  exports: [HighschoolsService],
})
export class HighschoolsModule {}
