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
  Experience,
  ExperienceDocument,
  ExperienceCompletionType,
} from '../experiences/schemas/experience.schema';
import { ApproveExperienceProgressDto } from './dto/approve-experience-progress.dto';
import { MarkExperienceViewedDto } from './dto/mark-experience-viewed.dto';
import { RejectExperienceProgressDto } from './dto/reject-experience-progress.dto';
import { SubmitExperienceEvidenceDto } from './dto/submit-experience-evidence.dto';
import {
  ExperienceProgress,
  ExperienceProgressDocument,
  ExperienceProgressStatus,
} from './schemas/experience-progress.schema';

const DEFAULT_PROGRESS_POPULATE: PopulateOptions[] = [
  {
    path: 'experience',
    select:
      'title start_date start_time end_date end_time timing_type delay_days length_days sequence completion_required prerequisite end_with_parent xp_completion xp_view gems completion_type auto_complete organization project category subcategory',
  },
  {
    path: 'user',
    select: 'firstName lastName email role isActive',
  },
  {
    path: 'adminReviewer',
    select: 'firstName lastName email role',
  },
];

const EXPERIENCE_PROGRESS_QUERY_CONFIG: MongooseQueryConfig<ExperienceProgressDocument> =
  {
    searchableFields: [],
    filterableFields: {
      status: { type: 'string', operators: ['eq', 'in'] },
      user: { type: 'objectId', operators: ['eq', 'in'] },
      experience: { type: 'objectId', operators: ['eq', 'in'] },
      organization: { type: 'objectId', operators: ['eq', 'in'] },
      adminReviewer: { type: 'objectId', operators: ['eq', 'in'] },
      createdAt: { type: 'date', operators: ['gte', 'lte'] },
      updatedAt: { type: 'date', operators: ['gte', 'lte'] },
      viewedAt: { type: 'date', operators: ['gte', 'lte'] },
      submittedAt: { type: 'date', operators: ['gte', 'lte'] },
      completedAt: { type: 'date', operators: ['gte', 'lte'] },
    },
    allowedSortFields: [
      'createdAt',
      'updatedAt',
      'viewedAt',
      'submittedAt',
      'completedAt',
      'status',
    ],
    defaultSort: { createdAt: -1 },
    defaultPopulate: DEFAULT_PROGRESS_POPULATE,
  };

@Injectable()
export class ExperienceProgressService {
  constructor(
    @InjectModel(ExperienceProgress.name)
    private readonly progressModel: Model<ExperienceProgressDocument>,
    @InjectModel(Experience.name)
    private readonly experienceModel: Model<ExperienceDocument>,
  ) {}

  async findAll(
    rawQuery: Record<string, unknown> = {},
  ): Promise<ExecuteQueryResult<ExperienceProgressDocument>> {
    return executeMongooseQuery<ExperienceProgressDocument>({
      model: this.progressModel,
      rawQuery,
      config: EXPERIENCE_PROGRESS_QUERY_CONFIG,
    });
  }

  async findOne(id: string): Promise<ExperienceProgressDocument> {
    const progress = await this.progressModel
      .findById(id)
      .populate(DEFAULT_PROGRESS_POPULATE)
      .exec();

    if (!progress) {
      throw new NotFoundException(
        `Experience progress with id "${id}" not found.`,
      );
    }

    return progress;
  }

  async findByExperience(
    experienceId: string,
    rawQuery: Record<string, unknown> = {},
  ): Promise<ExecuteQueryResult<ExperienceProgressDocument>> {
    const experienceObjectId = new Types.ObjectId(experienceId);
    return executeMongooseQuery<ExperienceProgressDocument>({
      model: this.progressModel,
      rawQuery,
      baseFilter: { experience: experienceObjectId },
      config: {
        ...EXPERIENCE_PROGRESS_QUERY_CONFIG,
        defaultSort: { createdAt: -1 },
      },
    });
  }

  async findByUser(
    userId: string,
    rawQuery: Record<string, unknown> = {},
  ): Promise<ExecuteQueryResult<ExperienceProgressDocument>> {
    const userObjectId = new Types.ObjectId(userId);
    return executeMongooseQuery<ExperienceProgressDocument>({
      model: this.progressModel,
      rawQuery,
      baseFilter: { user: userObjectId },
      config: {
        ...EXPERIENCE_PROGRESS_QUERY_CONFIG,
        defaultSort: { createdAt: -1 },
      },
    });
  }

  async markViewed(
    experienceId: string,
    dto: MarkExperienceViewedDto,
  ): Promise<ExperienceProgressDocument> {
    const experience = await this.ensureExperience(experienceId);
    const userObjectId = new Types.ObjectId(dto.userId);
    const now = new Date();

    const progress = await this.loadOrCreateProgress({
      experience,
      user: userObjectId,
    });

    if (!progress.viewedAt) {
      progress.viewedAt = now;
      const viewXp = experience.xp_view ?? 0;
      if (viewXp > 0) {
        progress.xpAwarded = Math.max(progress.xpAwarded, viewXp);
      }
    }

    if (progress.status === ExperienceProgressStatus.NotStarted) {
      progress.status = ExperienceProgressStatus.Viewed;
    }

    await progress.save();
    await progress.populate(DEFAULT_PROGRESS_POPULATE);
    return progress;
  }

  async submitEvidence(
    experienceId: string,
    dto: SubmitExperienceEvidenceDto,
  ): Promise<ExperienceProgressDocument> {
    const experience = await this.ensureExperience(experienceId);
    const userObjectId = new Types.ObjectId(dto.userId);
    const now = new Date();

    const progress = await this.loadOrCreateProgress({
      experience,
      user: userObjectId,
    });

    progress.status = ExperienceProgressStatus.EvidenceSubmitted;
    progress.submittedAt = now;
    progress.rejectedAt = undefined;
    progress.adminReviewer = undefined;

    if (dto.evidence) {
      progress.evidence = { ...dto.evidence };
    } else {
      progress.evidence = undefined;
    }

    if (dto.metadata) {
      progress.metadata = new Map(Object.entries(dto.metadata));
      progress.markModified('metadata');
    } else {
      progress.metadata = undefined;
    }

    if (!progress.viewedAt) {
      progress.viewedAt = now;
      const viewXp = experience.xp_view ?? 0;
      if (viewXp > 0) {
        progress.xpAwarded = Math.max(progress.xpAwarded, viewXp);
      }
    }

    progress.reviewNote = undefined;

    if (!this.requiresManualReview(progress)) {
      const completed = await this.completeProgress({
        progress,
        experience,
        now,
      });
      return completed;
    }

    await progress.save();
    await progress.populate(DEFAULT_PROGRESS_POPULATE);
    return progress;
  }

  async approve(
    progressId: string,
    dto: ApproveExperienceProgressDto,
  ): Promise<ExperienceProgressDocument> {
    const progress = await this.progressModel.findById(progressId).exec();

    if (!progress) {
      throw new NotFoundException(
        `Experience progress with id "${progressId}" not found.`,
      );
    }

    if (progress.status === ExperienceProgressStatus.Completed) {
      return this.progressModel
        .findById(progressId)
        .populate(DEFAULT_PROGRESS_POPULATE)
        .exec() as Promise<ExperienceProgressDocument>;
    }

    if (progress.status !== ExperienceProgressStatus.EvidenceSubmitted) {
      throw new BadRequestException(
        'Only submissions awaiting review can be approved.',
      );
    }

    const experience = await this.ensureExperience(
      progress.experience.toString(),
    );
    const adminObjectId = new Types.ObjectId(dto.adminId);
    const now = new Date();

    const completed = await this.completeProgress({
      progress,
      experience,
      now,
      admin: adminObjectId,
      reviewNote: dto.reviewNote,
      xpOverride: dto.xpAwarded,
      gemsOverride: dto.gemsAwarded,
    });

    return completed;
  }

  async reject(
    progressId: string,
    dto: RejectExperienceProgressDto,
  ): Promise<ExperienceProgressDocument> {
    const progress = await this.progressModel.findById(progressId).exec();

    if (!progress) {
      throw new NotFoundException(
        `Experience progress with id "${progressId}" not found.`,
      );
    }

    if (progress.status === ExperienceProgressStatus.Completed) {
      throw new BadRequestException(
        'Completed submissions cannot be rejected.',
      );
    }

    const adminObjectId = new Types.ObjectId(dto.adminId);
    const now = new Date();

    progress.status = ExperienceProgressStatus.Rejected;
    progress.rejectedAt = now;
    progress.adminReviewer = adminObjectId;
    progress.reviewNote = dto.reviewNote;

    await progress.save();
    await progress.populate(DEFAULT_PROGRESS_POPULATE);
    return progress;
  }

  private async completeProgress(args: {
    progress: ExperienceProgressDocument;
    experience: ExperienceDocument;
    now: Date;
    admin?: Types.ObjectId;
    reviewNote?: string;
    xpOverride?: number;
    gemsOverride?: number;
  }): Promise<ExperienceProgressDocument> {
    const {
      progress,
      experience,
      now,
      admin,
      reviewNote,
      xpOverride,
      gemsOverride,
    } = args;

    const completionXp = xpOverride ?? experience.xp_completion ?? 0;
    const viewXp = experience.xp_view ?? 0;
    const targetXp = Math.max(progress.xpAwarded, viewXp) + completionXp;
    const targetGems = gemsOverride ?? experience.gems ?? 0;

    progress.status = ExperienceProgressStatus.Completed;
    progress.completedAt = now;
    progress.rejectedAt = undefined;
    progress.submittedAt = progress.submittedAt ?? now;
    progress.reviewNote = reviewNote;
    progress.adminReviewer = admin ?? progress.adminReviewer;
    progress.xpAwarded = targetXp;
    progress.gemsAwarded = targetGems;

    if (!progress.viewedAt) {
      progress.viewedAt = now;
    }

    await progress.save();
    await progress.populate(DEFAULT_PROGRESS_POPULATE);
    return progress;
  }

  private async loadOrCreateProgress(args: {
    experience: ExperienceDocument;
    user: Types.ObjectId;
  }): Promise<ExperienceProgressDocument> {
    const { experience, user } = args;

    let progress = await this.progressModel
      .findOne({ experience: experience._id, user })
      .exec();

    const organizationId = this.castToObjectId(experience.organization);
    const projectId = this.castToObjectId(experience.project);
    const categoryId = this.castToObjectId(experience.category);
    const subcategoryId = this.castToObjectId(experience.subcategory);

    if (!progress) {
      progress = new this.progressModel({
        experience: experience._id,
        user,
        organization: organizationId,
        project: projectId,
        category: categoryId,
        subcategory: subcategoryId,
        completionTypeSnapshot: experience.completion_type,
        autoComplete: experience.auto_complete ?? false,
        xpAwarded: 0,
        gemsAwarded: 0,
        status: ExperienceProgressStatus.NotStarted,
      });
      return progress;
    }

    if (!progress.organization && organizationId) {
      progress.organization = organizationId;
    }

    if (!progress.project && projectId) {
      progress.project = projectId;
    }

    if (!progress.category && categoryId) {
      progress.category = categoryId;
    }

    if (!progress.subcategory && subcategoryId) {
      progress.subcategory = subcategoryId;
    }

    return progress;
  }

  private async ensureExperience(id: string): Promise<ExperienceDocument> {
    const experience = await this.experienceModel.findById(id).exec();

    if (!experience) {
      throw new NotFoundException(`Experience with id "${id}" not found.`);
    }

    return experience;
  }

  private requiresManualReview(progress: ExperienceProgressDocument): boolean {
    if (progress.autoComplete) {
      return false;
    }

    return (
      progress.completionTypeSnapshot === ExperienceCompletionType.Student ||
      progress.completionTypeSnapshot === ExperienceCompletionType.Photo ||
      progress.completionTypeSnapshot === ExperienceCompletionType.Admin
    );
  }

  private castToObjectId(
    value?: Types.ObjectId | string | null,
  ): Types.ObjectId | undefined {
    if (!value) {
      return undefined;
    }

    return value instanceof Types.ObjectId ? value : new Types.ObjectId(value);
  }
}
