import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PopulateOptions, Types } from 'mongoose';
import {
  ExecuteQueryResult,
  MongooseQueryConfig,
  executeMongooseQuery,
} from '../common/utils/mongoose-query.util';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';
import {
  Experience,
  ExperienceCompletionType,
  ExperienceDocument,
} from './schemas/experience.schema';

const DEFAULT_EXPERIENCE_POPULATE: PopulateOptions[] = [
  { path: 'experience_type', select: 'title color icon' },
  { path: 'organization', select: 'title organization_type is_active' },
  { path: 'project', select: 'title status is_active' },
  { path: 'category', select: 'title is_active' },
  { path: 'subcategory', select: 'title is_active' },
];

const EXPERIENCE_QUERY_CONFIG: MongooseQueryConfig<ExperienceDocument> = {
  searchableFields: ['title', 'subtitle', 'description'],
  filterableFields: {
    experience_type: { type: 'objectId', operators: ['eq', 'in'] },
    organization: { type: 'objectId', operators: ['eq', 'in'] },
    project: { type: 'objectId', operators: ['eq', 'in'] },
    category: { type: 'objectId', operators: ['eq', 'in'] },
    subcategory: { type: 'objectId', operators: ['eq', 'in'] },
    completion_type: { type: 'string', operators: ['eq', 'in'] },
    auto_complete: { type: 'boolean', operators: ['eq'] },
    start_date: { type: 'date', operators: ['gte', 'lte'] },
    end_date: { type: 'date', operators: ['gte', 'lte'] },
    createdAt: { type: 'date', operators: ['gte', 'lte'] },
    updatedAt: { type: 'date', operators: ['gte', 'lte'] },
  },
  allowedSortFields: [
    'title',
    'start_date',
    'end_date',
    'xp_completion',
    'xp_view',
    'gems',
    'createdAt',
    'updatedAt',
  ],
  defaultSort: { start_date: -1, start_time: -1 },
  defaultPopulate: DEFAULT_EXPERIENCE_POPULATE,
  allowedPopulatePaths: [
    'experience_type',
    'organization',
    'project',
    'category',
    'subcategory',
  ],
  defaultLimit: 25,
  maxLimit: 100,
  lean: false,
};

@Injectable()
export class ExperiencesService {
  constructor(
    @InjectModel(Experience.name)
    private readonly experienceModel: Model<ExperienceDocument>,
  ) {}

  async create(createDto: CreateExperienceDto): Promise<ExperienceDocument> {
    const payload: Partial<Experience> = {
      title: this.normalizeRequiredString(createDto.title),
      subtitle: this.normalizeOptionalString(createDto.subtitle) ?? '',
      description: this.normalizeRequiredString(createDto.description),
      image: this.normalizeOptionalString(createDto.image) ?? '',
      experience_type: new Types.ObjectId(createDto.experience_type),
      organization: new Types.ObjectId(createDto.organization),
      project: this.toOptionalObjectId(createDto.project),
      category: this.toOptionalObjectId(createDto.category),
      subcategory: this.toOptionalObjectId(createDto.subcategory),
      start_date: new Date(createDto.start_date),
      start_time: this.normalizeTimeString(createDto.start_time),
      end_date: new Date(createDto.end_date),
      end_time: this.normalizeTimeString(createDto.end_time),
      xp_completion: createDto.xp_completion,
      xp_view: createDto.xp_view,
      gems: createDto.gems,
      completion_type: createDto.completion_type,
      complete_url: this.normalizeOptionalString(createDto.complete_url),
      auto_complete: createDto.auto_complete ?? false,
      link_text: this.normalizeOptionalString(createDto.link_text),
      link_url: this.normalizeOptionalString(createDto.link_url),
    };

    const experience = new this.experienceModel(payload);
    const savedExperience = await experience.save();
    await savedExperience.populate(DEFAULT_EXPERIENCE_POPULATE);
    return savedExperience;
  }

  async findAll(
    rawQuery: Record<string, unknown> = {},
  ): Promise<ExecuteQueryResult<ExperienceDocument>> {
    return executeMongooseQuery<ExperienceDocument>({
      model: this.experienceModel,
      rawQuery,
      config: EXPERIENCE_QUERY_CONFIG,
    });
  }

  async findOne(id: string): Promise<ExperienceDocument> {
    const experience = await this.experienceModel
      .findById(id)
      .populate(DEFAULT_EXPERIENCE_POPULATE)
      .exec();

    if (!experience) {
      throw new NotFoundException(`Experience with id "${id}" not found.`);
    }

    return experience;
  }

  async update(
    id: string,
    updateDto: UpdateExperienceDto,
  ): Promise<ExperienceDocument> {
    const experience = await this.experienceModel.findById(id).exec();

    if (!experience) {
      throw new NotFoundException(`Experience with id "${id}" not found.`);
    }

    if (updateDto.title !== undefined) {
      experience.title = this.normalizeRequiredString(updateDto.title);
    }
    if (updateDto.subtitle !== undefined) {
      experience.subtitle =
        this.normalizeOptionalString(updateDto.subtitle) ?? '';
    }
    if (updateDto.description !== undefined) {
      experience.description = this.normalizeRequiredString(
        updateDto.description,
      );
    }
    if (updateDto.image !== undefined) {
      experience.image = this.normalizeOptionalString(updateDto.image) ?? '';
    }
    if (updateDto.experience_type !== undefined) {
      experience.experience_type = new Types.ObjectId(
        updateDto.experience_type,
      );
    }
    if (updateDto.organization !== undefined) {
      experience.organization = new Types.ObjectId(updateDto.organization);
    }
    if (updateDto.project !== undefined) {
      experience.project = this.toOptionalObjectId(updateDto.project);
    }
    if (updateDto.category !== undefined) {
      experience.category = this.toOptionalObjectId(updateDto.category);
    }
    if (updateDto.subcategory !== undefined) {
      experience.subcategory = this.toOptionalObjectId(updateDto.subcategory);
    }
    if (updateDto.start_date !== undefined) {
      experience.start_date = new Date(updateDto.start_date);
    }
    if (updateDto.start_time !== undefined) {
      experience.start_time = this.normalizeTimeString(updateDto.start_time);
    }
    if (updateDto.end_date !== undefined) {
      experience.end_date = new Date(updateDto.end_date);
    }
    if (updateDto.end_time !== undefined) {
      experience.end_time = this.normalizeTimeString(updateDto.end_time);
    }
    if (updateDto.xp_completion !== undefined) {
      experience.xp_completion = updateDto.xp_completion;
    }
    if (updateDto.xp_view !== undefined) {
      experience.xp_view = updateDto.xp_view;
    }
    if (updateDto.gems !== undefined) {
      experience.gems = updateDto.gems;
    }
    if (updateDto.completion_type !== undefined) {
      experience.completion_type = updateDto.completion_type;
      if (
        updateDto.completion_type !== ExperienceCompletionType.Link &&
        updateDto.complete_url === undefined
      ) {
        experience.complete_url = undefined;
      }
    }
    if (updateDto.complete_url !== undefined) {
      experience.complete_url = this.normalizeOptionalString(
        updateDto.complete_url,
      );
    }
    if (updateDto.auto_complete !== undefined) {
      experience.auto_complete = updateDto.auto_complete;
    }
    if (updateDto.link_text !== undefined) {
      experience.link_text = this.normalizeOptionalString(updateDto.link_text);
    }
    if (updateDto.link_url !== undefined) {
      experience.link_url = this.normalizeOptionalString(updateDto.link_url);
    }

    await experience.save();
    await experience.populate(DEFAULT_EXPERIENCE_POPULATE);
    return experience;
  }

  async remove(id: string): Promise<ExperienceDocument> {
    const experience = await this.experienceModel
      .findByIdAndDelete(id)
      .populate(DEFAULT_EXPERIENCE_POPULATE)
      .exec();

    if (!experience) {
      throw new NotFoundException(`Experience with id "${id}" not found.`);
    }

    return experience;
  }

  private normalizeRequiredString(value: string): string {
    return value.trim();
  }

  private normalizeOptionalString(value?: string | null): string | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  }

  private normalizeTimeString(value: string): string {
    return value.trim();
  }

  private toOptionalObjectId(
    value?: string | null,
  ): Types.ObjectId | undefined {
    if (!value) {
      return undefined;
    }

    return new Types.ObjectId(value);
  }
}
