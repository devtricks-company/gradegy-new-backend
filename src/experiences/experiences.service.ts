import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PopulateOptions, Types, FilterQuery } from 'mongoose';
import {
  ExecuteQueryResult,
  MongooseQueryConfig,
  executeMongooseQuery,
} from '../common/utils/mongoose-query.util';
import { AccessControlService } from '../access-control/access-control.service';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import type { AccessScope } from '../access-control/interfaces/access-scope.interface';
import { UserRole } from '../users/schemas/user.schema';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';
import {
  Experience,
  ExperienceCompletionType,
  ExperienceDocument,
  ExperienceTimingType,
} from './schemas/experience.schema';
import {
  ExperienceProgress,
  ExperienceProgressDocument,
  ExperienceProgressStatus,
} from '../experience-progress/schemas/experience-progress.schema';
import { ExperienceStudentAccess } from './interfaces/experience-student-access.interface';

const DEFAULT_EXPERIENCE_POPULATE: PopulateOptions[] = [
  { path: 'experience_type', select: 'title color icon' },
  { path: 'organization', select: 'title organization_type is_active' },
  { path: 'project', select: 'title status is_active' },
  { path: 'category', select: 'title is_active' },
  { path: 'subcategory', select: 'title is_active' },
  {
    path: 'prerequisite',
    select: 'title sequence timing_type completion_required',
  },
];

const EXPERIENCE_QUERY_CONFIG: MongooseQueryConfig<ExperienceDocument> = {
  searchableFields: ['title', 'subtitle', 'description'],
  filterableFields: {
    experience_type: { type: 'objectId', operators: ['eq', 'in'] },
    organization: { type: 'objectId', operators: ['eq', 'in'] },
    project: { type: 'objectId', operators: ['eq', 'in'] },
    category: { type: 'objectId', operators: ['eq', 'in'] },
    subcategory: { type: 'objectId', operators: ['eq', 'in'] },
    driver_one: { type: 'string', operators: ['eq', 'in'] },
    driver_two: { type: 'string', operators: ['eq', 'in'] },
    timing_type: { type: 'string', operators: ['eq', 'in'] },
    delay_days: { type: 'number', operators: ['eq', 'gte', 'lte'] },
    length_days: { type: 'number', operators: ['eq', 'gte', 'lte'] },
    sequence: { type: 'number', operators: ['eq', 'gte', 'lte'] },
    prerequisite: { type: 'objectId', operators: ['eq', 'in'] },
    completion_required: { type: 'boolean', operators: ['eq'] },
    end_with_parent: { type: 'boolean', operators: ['eq'] },
    expPublish: { type: 'boolean', operators: ['eq'] },
    completion_type: { type: 'string', operators: ['eq', 'in'] },
    auto_complete: { type: 'boolean', operators: ['eq'] },
    start_date: { type: 'date', operators: ['gte', 'lte'] },
    end_date: { type: 'date', operators: ['gte', 'lte'] },
    createdAt: { type: 'date', operators: ['gte', 'lte'] },
    updatedAt: { type: 'date', operators: ['gte', 'lte'] },
  },
  allowedSortFields: [
    'title',
    'sequence',
    'start_date',
    'end_date',
    'delay_days',
    'xp_completion',
    'xp_view',
    'gems',
    'createdAt',
    'updatedAt',
  ],
  defaultSort: { sequence: 1, createdAt: -1 },
  defaultPopulate: DEFAULT_EXPERIENCE_POPULATE,
  allowedPopulatePaths: [
    'experience_type',
    'organization',
    'project',
    'category',
    'subcategory',
    'prerequisite',
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
    @InjectModel(ExperienceProgress.name)
    private readonly progressModel: Model<ExperienceProgressDocument>,
    private readonly accessControlService: AccessControlService,
  ) {}

  async create(createDto: CreateExperienceDto): Promise<ExperienceDocument> {
    const startDate = this.toOptionalDate(createDto.start_date);
    const endDate = this.toOptionalDate(createDto.end_date);
    const organizationId = new Types.ObjectId(createDto.organization);
    const prerequisiteId = this.toOptionalObjectId(createDto.prerequisite);
    const nextSequence = await this.calculateNextSequence(
      organizationId,
      prerequisiteId,
    );
    const payload: Partial<Experience> = {
      title: this.normalizeRequiredString(createDto.title),
      subtitle: this.normalizeOptionalString(createDto.subtitle) ?? '',
      description: this.normalizeRequiredString(createDto.description),
      image: this.normalizeOptionalString(createDto.image) ?? '',
      experience_type: new Types.ObjectId(createDto.experience_type),
      organization: organizationId,
      project: this.toOptionalObjectId(createDto.project),
      category: this.toOptionalObjectId(createDto.category),
      subcategory: this.toOptionalObjectId(createDto.subcategory),
      driver_one: createDto.driver_one ?? undefined,
      driver_two: createDto.driver_two ?? undefined,
      timing_type: createDto.timing_type,
      delay_days: createDto.delay_days ?? 0,
      length_days: createDto.length_days,
      sequence: nextSequence,
      prerequisite: prerequisiteId,
      completion_required: createDto.completion_required ?? false,
      end_with_parent: createDto.end_with_parent ?? false,
      expPublish: createDto.expPublish ?? false,
      start_date: startDate,
      end_date: endDate,
      start_time: this.normalizeOptionalTime(createDto.start_time),
      end_time: this.normalizeOptionalTime(createDto.end_time),
      xp_completion: createDto.xp_completion,
      xp_view: createDto.xp_view,
      gems: createDto.gems,
      completion_type: createDto.completion_type,
      complete_url: this.normalizeOptionalString(createDto.complete_url),
      auto_complete: createDto.auto_complete ?? false,
      link_text: this.normalizeOptionalString(createDto.link_text),
      link_url: this.normalizeOptionalString(createDto.link_url),
    };

    this.applyStartDateLengthDefaults(payload);

    const experience = new this.experienceModel(payload);
    const savedExperience = await experience.save();
    await savedExperience.populate(DEFAULT_EXPERIENCE_POPULATE);
    return savedExperience;
  }

  async findAll(
    rawQuery: Record<string, unknown> = {},
    user?: AuthenticatedUser,
  ): Promise<ExecuteQueryResult<ExperienceDocument>> {
    const baseFilter = await this.resolveAccessFilter(user);
    return executeMongooseQuery<ExperienceDocument>({
      model: this.experienceModel,
      rawQuery,
      config: EXPERIENCE_QUERY_CONFIG,
      baseFilter,
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

  async listStudentsWithAccess(
    id: string,
    rawQuery: Record<string, unknown> = {},
    user?: AuthenticatedUser,
  ): Promise<ExecuteQueryResult<ExperienceStudentAccess>> {
    const experience = await this.experienceModel.findById(id).exec();

    if (!experience) {
      throw new NotFoundException(`Experience with id "${id}" not found.`);
    }

    if (user) {
      const accessFilter = await this.resolveAccessFilter(user);
      if (accessFilter) {
        const accessible = await this.experienceModel.exists({
          _id: experience._id,
          ...accessFilter,
        });

        if (!accessible) {
          throw new NotFoundException(`Experience with id "${id}" not found.`);
        }
      }
    }

    const scopeResult =
      await this.accessControlService.listStudentsForExperienceScope(
        {
          organizationId: experience.organization,
          projectId: experience.project ?? null,
          categoryId: experience.category ?? null,
          subcategoryId: experience.subcategory ?? null,
        },
        rawQuery,
      );

    if (!scopeResult.data.length) {
      return {
        data: [],
        meta: scopeResult.meta,
      };
    }

    const studentIds: string[] = [];
    const entryUserIds = new Map<number, string>();

    scopeResult.data.forEach((entry, index) => {
      const userId = this.extractDocumentId(
        (entry.user as { _id?: unknown })._id ?? undefined,
      );
      if (userId) {
        studentIds.push(userId);
        entryUserIds.set(index, userId);
      }
    });

    const progressByStudent =
      studentIds.length > 0
        ? await this.loadProgressByStudent(experience._id, studentIds)
        : new Map<string, { status: ExperienceProgressStatus; completedAt: Date | null }>();

    const data: ExperienceStudentAccess[] = scopeResult.data.map((entry, index) => {
      const userId = entryUserIds.get(index);
      const progress = userId ? progressByStudent.get(userId) : undefined;
      const completed =
        progress?.status === ExperienceProgressStatus.Completed || false;
      const completedAt =
        completed && progress?.completedAt ? progress.completedAt : null;

      return {
        user: entry.user,
        assignments: entry.assignments,
        completed,
        completedAt,
      };
    });

    return {
      data,
      meta: scopeResult.meta,
    };
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
    if (updateDto.driver_one !== undefined) {
      experience.driver_one = updateDto.driver_one ?? undefined;
    }
    if (updateDto.driver_two !== undefined) {
      experience.driver_two = updateDto.driver_two ?? undefined;
    }
    if (updateDto.timing_type !== undefined) {
      experience.timing_type = updateDto.timing_type;
    }
    if (updateDto.delay_days !== undefined) {
      experience.delay_days = updateDto.delay_days;
    }
    if (updateDto.length_days !== undefined) {
      experience.length_days = updateDto.length_days;
    }
    if (updateDto.sequence !== undefined) {
      experience.sequence = updateDto.sequence;
    }
    if (updateDto.prerequisite !== undefined) {
      experience.prerequisite = this.toOptionalObjectId(updateDto.prerequisite);
    }
    if (updateDto.completion_required !== undefined) {
      experience.completion_required = updateDto.completion_required;
    }
    if (updateDto.end_with_parent !== undefined) {
      experience.end_with_parent = updateDto.end_with_parent;
    }
    if (updateDto.expPublish !== undefined) {
      experience.expPublish = updateDto.expPublish;
    }
    if (updateDto.start_date !== undefined) {
      experience.start_date = this.toOptionalDate(updateDto.start_date);
    }
    if (updateDto.start_time !== undefined) {
      experience.start_time = this.normalizeOptionalTime(updateDto.start_time);
    }
    if (updateDto.end_date !== undefined) {
      experience.end_date = this.toOptionalDate(updateDto.end_date);
    }
    if (updateDto.end_time !== undefined) {
      experience.end_time = this.normalizeOptionalTime(updateDto.end_time);
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

    this.applyStartDateLengthDefaults(experience);

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

  private normalizeOptionalTime(value?: string | null): string | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }

    return value.trim();
  }

  private toOptionalObjectId(
    value?: string | null,
  ): Types.ObjectId | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    return new Types.ObjectId(value);
  }

  private toOptionalDate(value?: string | Date | null): Date | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    return value instanceof Date ? value : new Date(value);
  }

  private applyStartDateLengthDefaults(target: Partial<Experience>): void {
    if (
      target.timing_type === ExperienceTimingType.StartDateAndLength &&
      target.start_date instanceof Date &&
      typeof target.length_days === 'number'
    ) {
      target.end_date = this.calculateInclusiveEndDate(
        target.start_date,
        target.length_days,
      );
      if (!target.end_time && target.start_time) {
        target.end_time = target.start_time;
      }
    }
  }

  private calculateInclusiveEndDate(startDate: Date, lengthDays: number): Date {
    const result = new Date(startDate.getTime());
    const offset = Math.max(0, lengthDays - 1);
    result.setUTCDate(result.getUTCDate() + offset);
    return result;
  }

  private async loadProgressByStudent(
    experienceId: Types.ObjectId,
    studentIds: string[],
  ): Promise<
    Map<string, { status: ExperienceProgressStatus; completedAt: Date | null }>
  > {
    const uniqueStudentIds = Array.from(new Set(studentIds));
    if (!uniqueStudentIds.length) {
      return new Map();
    }

    const progressRecords = await this.progressModel
      .find({
        experience: experienceId,
        user: { $in: this.toObjectIdArray(uniqueStudentIds) },
      })
      .select('user status completedAt updatedAt')
      .sort({ updatedAt: -1 })
      .lean()
      .exec();

    const progressMap = new Map<
      string,
      { status: ExperienceProgressStatus; completedAt: Date | null }
    >();

    for (const record of progressRecords) {
      const recordUserId = this.extractDocumentId(
        (record.user as Types.ObjectId | string | undefined) ?? undefined,
      );

      if (!recordUserId || progressMap.has(recordUserId)) {
        continue;
      }

      const status = record.status as ExperienceProgressStatus;
      let completedAt: Date | null = null;

      if (status === ExperienceProgressStatus.Completed) {
        const rawCompletedAt = record.completedAt as
          | Date
          | string
          | undefined;
        if (rawCompletedAt instanceof Date) {
          completedAt = rawCompletedAt;
        } else if (typeof rawCompletedAt === 'string') {
          const parsed = new Date(rawCompletedAt);
          if (!Number.isNaN(parsed.getTime())) {
            completedAt = parsed;
          }
        }
      }

      progressMap.set(recordUserId, { status, completedAt });
    }

    return progressMap;
  }

  private extractDocumentId(value: unknown): string | null {
    if (!value) {
      return null;
    }

    if (value instanceof Types.ObjectId) {
      return value.toHexString();
    }

    if (typeof value === 'string') {
      if (!Types.ObjectId.isValid(value)) {
        return null;
      }
      return new Types.ObjectId(value).toHexString();
    }

    return null;
  }

  private async calculateNextSequence(
    organizationId: Types.ObjectId,
    prerequisiteId?: Types.ObjectId,
  ): Promise<number> {
    const latestInOrganization = await this.experienceModel
      .findOne({ organization: organizationId })
      .sort({ sequence: -1 })
      .select('sequence')
      .exec();

    let nextSequence = (latestInOrganization?.sequence ?? 0) + 1;

    if (!prerequisiteId) {
      return nextSequence;
    }

    const lastChild = await this.experienceModel
      .findOne({ prerequisite: prerequisiteId })
      .sort({ sequence: -1 })
      .select('sequence')
      .exec();

    if (lastChild?.sequence !== undefined) {
      return Math.max(nextSequence, lastChild.sequence + 1);
    }

    const parent = await this.experienceModel
      .findById(prerequisiteId)
      .select('sequence')
      .exec();

    if (parent?.sequence === undefined) {
      return nextSequence;
    }

    return Math.max(nextSequence, parent.sequence + 1);
  }

  private async resolveAccessFilter(
    user?: AuthenticatedUser,
  ): Promise<FilterQuery<ExperienceDocument> | undefined> {
    if (!user) {
      return undefined;
    }

    if (user.role === UserRole.Ultra) {
      return undefined;
    }

    if (user.role === UserRole.Super) {
      const scope = await this.accessControlService.getAccessScope(user.id);
      return this.buildOrganizationFilter(scope.organizationIds);
    }

    if (user.role === UserRole.Admin) {
      const scope = await this.accessControlService.getAccessScope(user.id);
      return this.buildAdminAccessFilter(scope);
    }

    return undefined;
  }

  private buildOrganizationFilter(
    organizationIds: ReadonlySet<string>,
  ): FilterQuery<ExperienceDocument> {
    const ids = this.toObjectIdArray(organizationIds);
    if (!ids.length) {
      return { _id: { $exists: false } };
    }
    return { organization: { $in: ids } };
  }

  private buildAdminAccessFilter(
    scope: AccessScope,
  ): FilterQuery<ExperienceDocument> {
    const clauses: FilterQuery<ExperienceDocument>[] = [];

    const orgIds = this.toObjectIdArray(scope.orgWideOrganizationIds);
    if (orgIds.length) {
      clauses.push({ organization: { $in: orgIds } });
    }

    const projectIds = this.toObjectIdArray(scope.projectIds);
    if (projectIds.length) {
      clauses.push({ project: { $in: projectIds } });
    }

    const categoryIds = this.toObjectIdArray(scope.categoryIds);
    if (categoryIds.length) {
      clauses.push({ category: { $in: categoryIds } });
    }

    const subcategoryIds = this.toObjectIdArray(scope.subcategoryIds);
    if (subcategoryIds.length) {
      clauses.push({ subcategory: { $in: subcategoryIds } });
    }

    if (!clauses.length) {
      return { _id: { $exists: false } };
    }

    return { $or: clauses };
  }

  private toObjectIdArray(values: Iterable<string>): Types.ObjectId[] {
    const uniqueValues = Array.from(new Set(values));
    if (!uniqueValues.length) {
      return [];
    }
    return uniqueValues.map((value) => new Types.ObjectId(value));
  }
}
