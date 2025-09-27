import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ExecuteQueryResult,
  MongooseQueryConfig,
  executeMongooseQuery,
} from '../common/utils/mongoose-query.util';
import { CreateHighschoolDto } from './dto/create-highschool.dto';
import { UpdateHighschoolDto } from './dto/update-highschool.dto';
import { Highschool, HighschoolDocument } from './schemas/highschool.schema';

const HIGH_SCHOOL_QUERY_CONFIG: MongooseQueryConfig<HighschoolDocument> = {
  searchableFields: [
    'school_name',
    'school_id',
    'state_name',
    'agency_name',
    'school_type',
    'school_level',
  ],
  filterableFields: {
    school_name: { type: 'string', operators: ['eq', 'in'] },
    school_id: { type: 'string', operators: ['eq', 'in'] },
    state_name: { type: 'string', operators: ['eq', 'in'] },
    agency_name: { type: 'string', operators: ['eq', 'in'] },
    agency_id: { type: 'string', operators: ['eq', 'in'] },
    school_type: { type: 'string', operators: ['eq', 'in'] },
    school_level: { type: 'string', operators: ['eq', 'in'] },
    school_state_id: { type: 'string', operators: ['eq', 'in'] },
    state_agency_id: { type: 'string', operators: ['eq', 'in'] },
    is_active: { type: 'boolean', operators: ['eq'] },
    createdAt: { type: 'date', operators: ['gte', 'lte'] },
    updatedAt: { type: 'date', operators: ['gte', 'lte'] },
  },
  allowedSortFields: [
    'school_name',
    'school_id',
    'state_name',
    'agency_name',
    'agency_id',
    'school_type',
    'school_level',
    'school_state_id',
    'state_agency_id',
    'createdAt',
    'updatedAt',
  ],
  defaultSort: { school_name: 1 },
  defaultLimit: 25,
  maxLimit: 100,
  lean: false,
};

@Injectable()
export class HighschoolsService {
  constructor(
    @InjectModel(Highschool.name)
    private readonly highschoolModel: Model<HighschoolDocument>,
  ) {}

  async create(createDto: CreateHighschoolDto): Promise<HighschoolDocument> {
    const payload: Partial<Highschool> = {
      ...createDto,
      school_name: createDto.school_name.trim(),
      state_name: createDto.state_name.trim(),
      school_id: createDto.school_id.trim(),
      agency_name: createDto.agency_name.trim(),
      agency_id: createDto.agency_id.trim(),
      school_type: createDto.school_type.trim(),
      school_level: createDto.school_level.trim(),
      school_state_id: createDto.school_state_id.trim(),
      state_agency_id: createDto.state_agency_id.trim(),
      is_active: createDto.is_active ?? true,
    };

    const createdHighschool = new this.highschoolModel(payload);
    return createdHighschool.save();
  }

  async findAll(
    rawQuery: Record<string, unknown> = {},
  ): Promise<ExecuteQueryResult<HighschoolDocument>> {
    return executeMongooseQuery<HighschoolDocument>({
      model: this.highschoolModel,
      rawQuery,
      config: HIGH_SCHOOL_QUERY_CONFIG,
    });
  }

  async findOne(id: string): Promise<HighschoolDocument> {
    const highschool = await this.highschoolModel.findById(id).exec();

    if (!highschool) {
      throw new NotFoundException(`Highschool with id "${id}" not found.`);
    }

    return highschool;
  }

  async update(
    id: string,
    updateDto: UpdateHighschoolDto,
  ): Promise<HighschoolDocument> {
    const updatePayload: Partial<Highschool> = {};

    if (updateDto.school_name !== undefined) {
      updatePayload.school_name = updateDto.school_name.trim();
    }
    if (updateDto.state_name !== undefined) {
      updatePayload.state_name = updateDto.state_name.trim();
    }
    if (updateDto.school_id !== undefined) {
      updatePayload.school_id = updateDto.school_id.trim();
    }
    if (updateDto.agency_name !== undefined) {
      updatePayload.agency_name = updateDto.agency_name.trim();
    }
    if (updateDto.agency_id !== undefined) {
      updatePayload.agency_id = updateDto.agency_id.trim();
    }
    if (updateDto.school_type !== undefined) {
      updatePayload.school_type = updateDto.school_type.trim();
    }
    if (updateDto.school_level !== undefined) {
      updatePayload.school_level = updateDto.school_level.trim();
    }
    if (updateDto.school_state_id !== undefined) {
      updatePayload.school_state_id = updateDto.school_state_id.trim();
    }
    if (updateDto.state_agency_id !== undefined) {
      updatePayload.state_agency_id = updateDto.state_agency_id.trim();
    }
    if (updateDto.is_active !== undefined) {
      updatePayload.is_active = updateDto.is_active;
    }

    const updatedHighschool = await this.highschoolModel
      .findByIdAndUpdate(id, updatePayload, { new: true })
      .exec();

    if (!updatedHighschool) {
      throw new NotFoundException(`Highschool with id "${id}" not found.`);
    }

    return updatedHighschool;
  }

  async remove(id: string): Promise<HighschoolDocument> {
    const deletedHighschool = await this.highschoolModel
      .findByIdAndDelete(id)
      .exec();

    if (!deletedHighschool) {
      throw new NotFoundException(`Highschool with id "${id}" not found.`);
    }

    return deletedHighschool;
  }
}
