import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ExecuteQueryResult,
  MongooseQueryConfig,
  executeMongooseQuery,
} from '../common/utils/mongoose-query.util';
import { CreateSchoolDistrictDto } from './dto/create-school-district.dto';
import { UpdateSchoolDistrictDto } from './dto/update-school-district.dto';
import {
  SchoolDistrict,
  SchoolDistrictDocument,
} from './schemas/school-district.schema';

const SCHOOL_DISTRICT_QUERY_CONFIG: MongooseQueryConfig<SchoolDistrictDocument> =
  {
    searchableFields: [
      'agancy_id',
      'agancy_name',
      'state_name',
      'state_agancy_id',
    ],
    filterableFields: {
      agancy_id: { type: 'string', operators: ['eq', 'in'] },
      agancy_name: { type: 'string', operators: ['eq', 'in'] },
      state_name: { type: 'string', operators: ['eq', 'in'] },
      state_agancy_id: { type: 'string', operators: ['eq', 'in'] },
      isActive: { type: 'boolean', operators: ['eq'] },
      createdAt: { type: 'date', operators: ['gte', 'lte'] },
      updatedAt: { type: 'date', operators: ['gte', 'lte'] },
    },
    allowedSortFields: [
      'agancy_name',
      'agancy_id',
      'state_name',
      'state_agancy_id',
      'createdAt',
      'updatedAt',
    ],
    defaultSort: { agancy_name: 1 },
    defaultLimit: 25,
    maxLimit: 100,
    lean: false,
  };

@Injectable()
export class SchoolDistrictsService {
  constructor(
    @InjectModel(SchoolDistrict.name)
    private readonly schoolDistrictModel: Model<SchoolDistrictDocument>,
  ) {}

  async create(
    createDto: CreateSchoolDistrictDto,
  ): Promise<SchoolDistrictDocument> {
    const payload: Partial<SchoolDistrict> = {
      ...createDto,
      agancy_id: createDto.agancy_id.trim(),
      agancy_name: createDto.agancy_name.trim(),
      state_name: createDto.state_name.trim(),
      state_agancy_id: createDto.state_agancy_id.trim(),
      isActive: createDto.isActive ?? true,
    };

    const createdDistrict = new this.schoolDistrictModel(payload);
    return createdDistrict.save();
  }

  async findAll(
    rawQuery: Record<string, unknown> = {},
  ): Promise<ExecuteQueryResult<SchoolDistrictDocument>> {
    return executeMongooseQuery<SchoolDistrictDocument>({
      model: this.schoolDistrictModel,
      rawQuery,
      config: SCHOOL_DISTRICT_QUERY_CONFIG,
    });
  }

  async findOne(id: string): Promise<SchoolDistrictDocument> {
    const district = await this.schoolDistrictModel.findById(id).exec();

    if (!district) {
      throw new NotFoundException(`School district with id "${id}" not found.`);
    }

    return district;
  }

  async update(
    id: string,
    updateDto: UpdateSchoolDistrictDto,
  ): Promise<SchoolDistrictDocument> {
    const updatePayload: Partial<SchoolDistrict> = {};

    if (updateDto.agancy_id !== undefined) {
      updatePayload.agancy_id = updateDto.agancy_id.trim();
    }
    if (updateDto.agancy_name !== undefined) {
      updatePayload.agancy_name = updateDto.agancy_name.trim();
    }
    if (updateDto.state_name !== undefined) {
      updatePayload.state_name = updateDto.state_name.trim();
    }
    if (updateDto.state_agancy_id !== undefined) {
      updatePayload.state_agancy_id = updateDto.state_agancy_id.trim();
    }
    if (updateDto.isActive !== undefined) {
      updatePayload.isActive = updateDto.isActive;
    }

    const updatedDistrict = await this.schoolDistrictModel
      .findByIdAndUpdate(id, updatePayload, { new: true })
      .exec();

    if (!updatedDistrict) {
      throw new NotFoundException(`School district with id "${id}" not found.`);
    }

    return updatedDistrict;
  }

  async remove(id: string): Promise<SchoolDistrictDocument> {
    const deletedDistrict = await this.schoolDistrictModel
      .findByIdAndDelete(id)
      .exec();

    if (!deletedDistrict) {
      throw new NotFoundException(`School district with id "${id}" not found.`);
    }

    return deletedDistrict;
  }
}
