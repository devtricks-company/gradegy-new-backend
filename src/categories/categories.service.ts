import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PopulateOptions, Types } from 'mongoose';
import {
  ExecuteQueryResult,
  MongooseQueryConfig,
  executeMongooseQuery,
} from '../common/utils/mongoose-query.util';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category, CategoryDocument } from './schemas/category.schema';

const DEFAULT_CATEGORY_POPULATE: PopulateOptions[] = [
  { path: 'project', select: 'title status is_active' },
  {
    path: 'highschool',
    select: 'school_name school_id school_level is_active',
  },
];

const CATEGORY_QUERY_CONFIG: MongooseQueryConfig<CategoryDocument> = {
  searchableFields: ['title', 'school_level'],
  filterableFields: {
    title: { type: 'string', operators: ['eq', 'in'] },
    school_level: { type: 'string', operators: ['eq', 'in'] },
    localize_award: { type: 'boolean', operators: ['eq'] },
    coins: { type: 'boolean', operators: ['eq'] },
    store: { type: 'boolean', operators: ['eq'] },
    display_project: { type: 'boolean', operators: ['eq'] },
    is_active: { type: 'boolean', operators: ['eq'] },
    project: { type: 'objectId', operators: ['eq', 'in'] },
    highschool: { type: 'objectId', operators: ['eq', 'in'] },
    createdAt: { type: 'date', operators: ['gte', 'lte'] },
    updatedAt: { type: 'date', operators: ['gte', 'lte'] },
  },
  allowedSortFields: ['title', 'school_level', 'createdAt', 'updatedAt'],
  defaultSort: { title: 1 },
  defaultPopulate: DEFAULT_CATEGORY_POPULATE,
  allowedPopulatePaths: ['project', 'highschool'],
  defaultLimit: 25,
  maxLimit: 100,
  lean: false,
};

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  async create(createDto: CreateCategoryDto): Promise<CategoryDocument> {
    const payload: Partial<Category> = {
      title: this.normalizeTitle(createDto.title),
      school_level: this.normalizeOptionalString(createDto.school_level),
      localize_award: createDto.localize_award ?? false,
      coins: createDto.coins ?? false,
      store: createDto.store ?? false,
      display_project: createDto.display_project ?? false,
      is_active: createDto.is_active ?? true,
      project: new Types.ObjectId(createDto.project),
      highschool: this.toOptionalObjectId(createDto.highschool),
    };

    const category = new this.categoryModel(payload);
    const createdCategory = await category.save();
    await createdCategory.populate(DEFAULT_CATEGORY_POPULATE);
    return createdCategory;
  }

  async findAll(
    rawQuery: Record<string, unknown> = {},
  ): Promise<ExecuteQueryResult<CategoryDocument>> {
    return executeMongooseQuery<CategoryDocument>({
      model: this.categoryModel,
      rawQuery,
      config: CATEGORY_QUERY_CONFIG,
    });
  }

  async findOne(id: string): Promise<CategoryDocument> {
    const category = await this.categoryModel
      .findById(id)
      .populate(DEFAULT_CATEGORY_POPULATE)
      .exec();

    if (!category) {
      throw new NotFoundException(`Category with id "${id}" not found.`);
    }

    return category;
  }

  async update(
    id: string,
    updateDto: UpdateCategoryDto,
  ): Promise<CategoryDocument> {
    const updatePayload: Partial<Category> = {};

    if (updateDto.title !== undefined) {
      updatePayload.title = this.normalizeTitle(updateDto.title);
    }
    if (updateDto.school_level !== undefined) {
      updatePayload.school_level = this.normalizeOptionalString(
        updateDto.school_level,
      );
    }
    if (updateDto.localize_award !== undefined) {
      updatePayload.localize_award = updateDto.localize_award;
    }
    if (updateDto.coins !== undefined) {
      updatePayload.coins = updateDto.coins;
    }
    if (updateDto.store !== undefined) {
      updatePayload.store = updateDto.store;
    }
    if (updateDto.display_project !== undefined) {
      updatePayload.display_project = updateDto.display_project;
    }
    if (updateDto.is_active !== undefined) {
      updatePayload.is_active = updateDto.is_active;
    }
    if (updateDto.project !== undefined) {
      updatePayload.project = new Types.ObjectId(updateDto.project);
    }
    if (updateDto.highschool !== undefined) {
      updatePayload.highschool = this.toOptionalObjectId(updateDto.highschool);
    }

    const updatedCategory = await this.categoryModel
      .findByIdAndUpdate(id, updatePayload, { new: true })
      .populate(DEFAULT_CATEGORY_POPULATE)
      .exec();

    if (!updatedCategory) {
      throw new NotFoundException(`Category with id "${id}" not found.`);
    }

    return updatedCategory;
  }

  async remove(id: string): Promise<CategoryDocument> {
    const removedCategory = await this.categoryModel
      .findByIdAndDelete(id)
      .populate(DEFAULT_CATEGORY_POPULATE)
      .exec();

    if (!removedCategory) {
      throw new NotFoundException(`Category with id "${id}" not found.`);
    }

    return removedCategory;
  }

  private normalizeTitle(title: string): string {
    return title.trim();
  }

  private normalizeOptionalString(value?: string): string | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  }

  private toOptionalObjectId(value?: string): Types.ObjectId | undefined {
    if (!value) {
      return undefined;
    }

    return new Types.ObjectId(value);
  }
}
