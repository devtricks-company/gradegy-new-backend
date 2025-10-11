import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ExperienceType,
  ExperienceTypeDocument,
} from './schemas/experience-type.schema';

@Injectable()
export class ExperienceTypesService {
  constructor(
    @InjectModel(ExperienceType.name)
    private readonly experienceTypeModel: Model<ExperienceTypeDocument>,
  ) {}

  async findAll(): Promise<ExperienceTypeDocument[]> {
    return this.experienceTypeModel.find().sort({ title: 1 }).exec();
  }
}
