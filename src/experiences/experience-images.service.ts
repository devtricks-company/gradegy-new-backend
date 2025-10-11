import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PopulateOptions, Types } from 'mongoose';
import { CreateExperienceImageDto } from './dto/create-experience-image.dto';
import { UpdateExperienceImageDto } from './dto/update-experience-image.dto';
import {
  ExperienceImage,
  ExperienceImageDocument,
} from './schemas/experience-image.schema';

const EXPERIENCE_IMAGE_POPULATE: PopulateOptions = {
  path: 'experienceType',
  select: 'title color icon',
};

@Injectable()
export class ExperienceImagesService {
  constructor(
    @InjectModel(ExperienceImage.name)
    private readonly experienceImageModel: Model<ExperienceImageDocument>,
  ) {}

  async create(
    createDto: CreateExperienceImageDto,
  ): Promise<ExperienceImageDocument> {
    const payload: Partial<ExperienceImage> = {
      url: this.normalizeRequiredString(createDto.url),
      experienceType: new Types.ObjectId(createDto.experienceType),
      title: this.normalizeNullableString(createDto.title),
      tags: this.normalizeNullableString(createDto.tags),
      default: createDto.default ?? false,
    };

    const experienceImage = new this.experienceImageModel(payload);
    await experienceImage.save();
    await experienceImage.populate(EXPERIENCE_IMAGE_POPULATE);
    return experienceImage;
  }

  async findAll(): Promise<ExperienceImageDocument[]> {
    return this.experienceImageModel
      .find()
      .sort({ createdAt: -1 })
      .populate(EXPERIENCE_IMAGE_POPULATE)
      .exec();
  }

  async findOne(id: string): Promise<ExperienceImageDocument> {
    const experienceImage = await this.experienceImageModel
      .findById(id)
      .populate(EXPERIENCE_IMAGE_POPULATE)
      .exec();

    if (!experienceImage) {
      throw new NotFoundException(`Experience image with id "${id}" not found.`);
    }

    return experienceImage;
  }

  async update(
    id: string,
    updateDto: UpdateExperienceImageDto,
  ): Promise<ExperienceImageDocument> {
    const experienceImage = await this.experienceImageModel
      .findById(id)
      .exec();

    if (!experienceImage) {
      throw new NotFoundException(`Experience image with id "${id}" not found.`);
    }

    if (updateDto.url !== undefined) {
      experienceImage.url = this.normalizeRequiredString(updateDto.url);
    }

    if (updateDto.experienceType !== undefined) {
      experienceImage.experienceType = new Types.ObjectId(
        updateDto.experienceType,
      );
    }

    if (updateDto.title !== undefined) {
      experienceImage.title = this.normalizeNullableString(updateDto.title);
    }

    if (updateDto.tags !== undefined) {
      experienceImage.tags = this.normalizeNullableString(updateDto.tags);
    }

    if (updateDto.default !== undefined) {
      experienceImage.default = updateDto.default;
    }

    await experienceImage.save();
    await experienceImage.populate(EXPERIENCE_IMAGE_POPULATE);
    return experienceImage;
  }

  async remove(id: string): Promise<ExperienceImageDocument> {
    const experienceImage = await this.experienceImageModel
      .findByIdAndDelete(id)
      .populate(EXPERIENCE_IMAGE_POPULATE)
      .exec();

    if (!experienceImage) {
      throw new NotFoundException(`Experience image with id "${id}" not found.`);
    }

    return experienceImage;
  }

  private normalizeRequiredString(value: string): string {
    return value.trim();
  }

  private normalizeNullableString(
    value?: string | null,
  ): string | null | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }
}
