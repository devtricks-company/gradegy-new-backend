import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ExecuteQueryResult,
  MongooseQueryConfig,
  executeMongooseQuery,
} from '../common/utils/mongoose-query.util';
import { CreateUniversityDto } from './dto/create-university.dto';
import { UpdateUniversityDto } from './dto/update-university.dto';
import { University, UniversityDocument } from './schemas/university.schema';

const UNIVERSITY_QUERY_CONFIG: MongooseQueryConfig<UniversityDocument> = {
  searchableFields: ['instnm', 'united_id', 'city', 'county_name'],
  filterableFields: {
    united_id: { type: 'string', operators: ['eq', 'in'] },
    instnm: { type: 'string', operators: ['eq', 'in'] },
    city: { type: 'string', operators: ['eq', 'in'] },
    stabbr: { type: 'string', operators: ['eq', 'in'] },
    zip: { type: 'string', operators: ['eq', 'in'] },
    county_name: { type: 'string', operators: ['eq', 'in'] },
    active: { type: 'boolean', operators: ['eq'] },
    createdAt: { type: 'date', operators: ['gte', 'lte'] },
    updatedAt: { type: 'date', operators: ['gte', 'lte'] },
  },
  allowedSortFields: [
    'instnm',
    'united_id',
    'city',
    'stabbr',
    'county_name',
    'createdAt',
    'updatedAt',
  ],
  defaultSort: { instnm: 1 },
  defaultLimit: 25,
  maxLimit: 100,
  lean: false,
};

@Injectable()
export class UniversitiesService {
  constructor(
    @InjectModel(University.name)
    private readonly universityModel: Model<UniversityDocument>,
  ) {}

  async create(createDto: CreateUniversityDto): Promise<UniversityDocument> {
    const payload: Partial<University> = {
      united_id: createDto.united_id.trim(),
      instnm: createDto.instnm.trim(),
      address: createDto.address.trim(),
      city: createDto.city.trim(),
      stabbr: createDto.stabbr.trim(),
      zip: createDto.zip.trim(),
      website: createDto.website.trim(),
      county_name: createDto.county_name.trim(),
      longitude: createDto.longitude.trim(),
      latitude: createDto.latitude.trim(),
      active: createDto.active ?? true,
    };

    const university = new this.universityModel(payload);
    return university.save();
  }

  async findAll(
    rawQuery: Record<string, unknown> = {},
  ): Promise<ExecuteQueryResult<UniversityDocument>> {
    return executeMongooseQuery<UniversityDocument>({
      model: this.universityModel,
      rawQuery,
      config: UNIVERSITY_QUERY_CONFIG,
    });
  }

  async findOne(id: string): Promise<UniversityDocument> {
    const university = await this.universityModel.findById(id).exec();

    if (!university) {
      throw new NotFoundException(`University with id "${id}" not found.`);
    }

    return university;
  }

  async update(
    id: string,
    updateDto: UpdateUniversityDto,
  ): Promise<UniversityDocument> {
    const updatePayload: Partial<University> = {};

    if (updateDto.united_id !== undefined) {
      updatePayload.united_id = updateDto.united_id.trim();
    }
    if (updateDto.instnm !== undefined) {
      updatePayload.instnm = updateDto.instnm.trim();
    }
    if (updateDto.address !== undefined) {
      updatePayload.address = updateDto.address.trim();
    }
    if (updateDto.city !== undefined) {
      updatePayload.city = updateDto.city.trim();
    }
    if (updateDto.stabbr !== undefined) {
      updatePayload.stabbr = updateDto.stabbr.trim();
    }
    if (updateDto.zip !== undefined) {
      updatePayload.zip = updateDto.zip.trim();
    }
    if (updateDto.website !== undefined) {
      updatePayload.website = updateDto.website.trim();
    }
    if (updateDto.county_name !== undefined) {
      updatePayload.county_name = updateDto.county_name.trim();
    }
    if (updateDto.longitude !== undefined) {
      updatePayload.longitude = updateDto.longitude.trim();
    }
    if (updateDto.latitude !== undefined) {
      updatePayload.latitude = updateDto.latitude.trim();
    }
    if (updateDto.active !== undefined) {
      updatePayload.active = updateDto.active;
    }

    const university = await this.universityModel
      .findByIdAndUpdate(id, updatePayload, { new: true })
      .exec();

    if (!university) {
      throw new NotFoundException(`University with id "${id}" not found.`);
    }

    return university;
  }

  async remove(id: string): Promise<UniversityDocument> {
    const university = await this.universityModel.findByIdAndDelete(id).exec();

    if (!university) {
      throw new NotFoundException(`University with id "${id}" not found.`);
    }

    return university;
  }
}
