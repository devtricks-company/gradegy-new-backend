import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PopulateOptions, Types } from 'mongoose';
import {
  ExecuteQueryResult,
  MongooseQueryConfig,
  executeMongooseQuery,
} from '../common/utils/mongoose-query.util';
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

const EXPERIENCE_IMAGE_QUERY_CONFIG: MongooseQueryConfig<ExperienceImageDocument> =
  {
    searchableFields: ['url', 'title', 'tags'],
    filterableFields: {
      url: { type: 'string', operators: ['eq', 'in'] },
      title: { type: 'string', operators: ['eq', 'in'] },
      tags: { type: 'string', operators: ['eq', 'in'] },
      default: { type: 'boolean', operators: ['eq'] },
      experienceType: { type: 'objectId', operators: ['eq', 'in'] },
      createdAt: { type: 'date', operators: ['gte', 'lte'] },
      updatedAt: { type: 'date', operators: ['gte', 'lte'] },
    },
    allowedSortFields: [
      'url',
      'title',
      'default',
      'experienceType',
      'createdAt',
      'updatedAt',
    ],
    defaultSort: { createdAt: -1 },
    defaultPopulate: EXPERIENCE_IMAGE_POPULATE,
    allowedPopulatePaths: ['experienceType'],
    defaultLimit: 25,
    maxLimit: 100,
    lean: false,
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

  async findAll(
    rawQuery: Record<string, unknown> = {},
  ): Promise<ExecuteQueryResult<ExperienceImageDocument>> {
    return executeMongooseQuery<ExperienceImageDocument>({
      model: this.experienceImageModel,
      rawQuery,
      config: EXPERIENCE_IMAGE_QUERY_CONFIG,
    });
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
