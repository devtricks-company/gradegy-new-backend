import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PopulateOptions, Types } from 'mongoose';
import {
  ExecuteQueryResult,
  MongooseQueryConfig,
  executeMongooseQuery,
} from '../common/utils/mongoose-query.util';
import {
  Category,
  CategoryDocument,
} from '../categories/schemas/category.schema';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';
import { Subcategory, SubcategoryDocument } from './schemas/subcategory.schema';

const DEFAULT_SUBCATEGORY_POPULATE: PopulateOptions[] = [
  { path: 'category', select: 'title is_active' },
];

const SUBCATEGORY_QUERY_CONFIG: MongooseQueryConfig<SubcategoryDocument> = {
  searchableFields: ['title'],
  filterableFields: {
    title: { type: 'string', operators: ['eq', 'in'] },
    category: { type: 'objectId', operators: ['eq', 'in'] },
    localize_reward: { type: 'boolean', operators: ['eq'] },
    coins: { type: 'boolean', operators: ['eq'] },
    store: { type: 'boolean', operators: ['eq'] },
    is_active: { type: 'boolean', operators: ['eq'] },
    createdAt: { type: 'date', operators: ['gte', 'lte'] },
    updatedAt: { type: 'date', operators: ['gte', 'lte'] },
  },
  allowedSortFields: ['title', 'createdAt', 'updatedAt'],
  defaultSort: { title: 1 },
  defaultPopulate: DEFAULT_SUBCATEGORY_POPULATE,
  allowedPopulatePaths: ['category'],
  defaultLimit: 25,
  maxLimit: 100,
  lean: false,
};

@Injectable()
export class SubcategoriesService {
  constructor(
    @InjectModel(Subcategory.name)
    private readonly subcategoryModel: Model<SubcategoryDocument>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  async create(createDto: CreateSubcategoryDto): Promise<SubcategoryDocument> {
    const categoryId = this.toObjectId(createDto.category);
    await this.ensureCategoryExists(categoryId);

    const payload: Partial<Subcategory> = {
      title: this.normalizeTitle(createDto.title),
      category: categoryId,
      localize_reward: createDto.localize_reward ?? false,
      coins: createDto.coins ?? false,
      store: createDto.store ?? false,
      is_active: createDto.is_active ?? true,
    };

    const createdSubcategory = await new this.subcategoryModel(payload).save();
    await createdSubcategory.populate(DEFAULT_SUBCATEGORY_POPULATE);
    return createdSubcategory;
  }

  async findAll(
    rawQuery: Record<string, unknown> = {},
  ): Promise<ExecuteQueryResult<SubcategoryDocument>> {
    return executeMongooseQuery<SubcategoryDocument>({
      model: this.subcategoryModel,
      rawQuery,
      config: SUBCATEGORY_QUERY_CONFIG,
    });
  }

  async findAllByCategory(
    categoryId: string,
    rawQuery: Record<string, unknown> = {},
  ): Promise<ExecuteQueryResult<SubcategoryDocument>> {
    const categoryObjectId = this.toObjectId(categoryId);
    await this.ensureCategoryExists(categoryObjectId);

    return executeMongooseQuery<SubcategoryDocument>({
      model: this.subcategoryModel,
      rawQuery,
      config: SUBCATEGORY_QUERY_CONFIG,
      baseFilter: { category: categoryObjectId },
    });
  }

  async findOne(id: string): Promise<SubcategoryDocument> {
    const subcategory = await this.subcategoryModel
      .findById(id)
      .populate(DEFAULT_SUBCATEGORY_POPULATE)
      .exec();

    if (!subcategory) {
      throw new NotFoundException(`Subcategory with id "${id}" not found.`);
    }

    return subcategory;
  }

  async update(
    id: string,
    updateDto: UpdateSubcategoryDto,
  ): Promise<SubcategoryDocument> {
    const updatePayload: Partial<Subcategory> = {};

    if (updateDto.title !== undefined) {
      updatePayload.title = this.normalizeTitle(updateDto.title);
    }
    if (updateDto.category !== undefined) {
      const nextCategoryId = this.toObjectId(updateDto.category);
      await this.ensureCategoryExists(nextCategoryId);
      updatePayload.category = nextCategoryId;
    }
    if (updateDto.localize_reward !== undefined) {
      updatePayload.localize_reward = updateDto.localize_reward;
    }
    if (updateDto.coins !== undefined) {
      updatePayload.coins = updateDto.coins;
    }
    if (updateDto.store !== undefined) {
      updatePayload.store = updateDto.store;
    }
    if (updateDto.is_active !== undefined) {
      updatePayload.is_active = updateDto.is_active;
    }

    const updatedSubcategory = await this.subcategoryModel
      .findByIdAndUpdate(id, updatePayload, { new: true })
      .populate(DEFAULT_SUBCATEGORY_POPULATE)
      .exec();

    if (!updatedSubcategory) {
      throw new NotFoundException(`Subcategory with id "${id}" not found.`);
    }

    return updatedSubcategory;
  }

  async remove(id: string): Promise<SubcategoryDocument> {
    const deletedSubcategory = await this.subcategoryModel
      .findByIdAndDelete(id)
      .populate(DEFAULT_SUBCATEGORY_POPULATE)
      .exec();

    if (!deletedSubcategory) {
      throw new NotFoundException(`Subcategory with id "${id}" not found.`);
    }

    return deletedSubcategory;
  }

  private normalizeTitle(title: string): string {
    return title.trim();
  }

  private toObjectId(value: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException('Provided category id is invalid.');
    }
    return new Types.ObjectId(value);
  }

  private async ensureCategoryExists(
    categoryId: Types.ObjectId,
  ): Promise<void> {
    const exists = await this.categoryModel.exists({ _id: categoryId });
    if (!exists) {
      throw new BadRequestException(
        `Category with id "${categoryId.toHexString()}" not found.`,
      );
    }
  }
}
