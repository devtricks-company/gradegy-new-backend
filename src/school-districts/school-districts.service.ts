import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateSchoolDistrictDto } from './dto/create-school-district.dto';
import { UpdateSchoolDistrictDto } from './dto/update-school-district.dto';
import { SchoolDistrict, SchoolDistrictDocument } from './schemas/school-district.schema';

@Injectable()
export class SchoolDistrictsService {
  constructor(
    @InjectModel(SchoolDistrict.name)
    private readonly schoolDistrictModel: Model<SchoolDistrictDocument>,
  ) {}

  async create(createDto: CreateSchoolDistrictDto): Promise<SchoolDistrictDocument> {
    const payload: Partial<SchoolDistrict> = {
      ...createDto,
      agencyId: createDto.agencyId.trim(),
      agencyName: createDto.agencyName.trim(),
      stateName: createDto.stateName.trim(),
      stateAgencyId: createDto.stateAgencyId.trim(),
      isActive: createDto.isActive ?? true,
    };

    const createdDistrict = new this.schoolDistrictModel(payload);
    return createdDistrict.save();
  }

  async findAll(): Promise<SchoolDistrictDocument[]> {
    return this.schoolDistrictModel.find().exec();
  }

  async findOne(id: string): Promise<SchoolDistrictDocument> {
    const district = await this.schoolDistrictModel.findById(id).exec();

    if (!district) {
      throw new NotFoundException(`School district with id "${id}" not found.`);
    }

    return district;
  }

  async update(id: string, updateDto: UpdateSchoolDistrictDto): Promise<SchoolDistrictDocument> {
    const updatePayload: Partial<SchoolDistrict> = {};

    if (updateDto.agencyId !== undefined) {
      updatePayload.agencyId = updateDto.agencyId.trim();
    }
    if (updateDto.agencyName !== undefined) {
      updatePayload.agencyName = updateDto.agencyName.trim();
    }
    if (updateDto.stateName !== undefined) {
      updatePayload.stateName = updateDto.stateName.trim();
    }
    if (updateDto.stateAgencyId !== undefined) {
      updatePayload.stateAgencyId = updateDto.stateAgencyId.trim();
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
    const deletedDistrict = await this.schoolDistrictModel.findByIdAndDelete(id).exec();

    if (!deletedDistrict) {
      throw new NotFoundException(`School district with id "${id}" not found.`);
    }

    return deletedDistrict;
  }
}
