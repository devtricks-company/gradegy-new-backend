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
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import {
  POST_SECONDARY_PROJECT_TYPES,
  Project,
  ProjectCondition,
  ProjectDocument,
  ProjectStatus,
  ProjectType,
  SECONDARY_PROJECT_TYPES,
} from './schemas/project.schema';

const SECONDARY_TYPE_SET = new Set<ProjectType>(SECONDARY_PROJECT_TYPES);
const POST_SECONDARY_TYPE_SET = new Set<ProjectType>(
  POST_SECONDARY_PROJECT_TYPES,
);

const DEFAULT_PROJECT_POPULATE: PopulateOptions[] = [
  {
    path: 'organizations',
    select: 'title organization_type is_active',
  },
  {
    path: 'school_district',
    select: 'agancy_name state_name state_agancy_id',
  },
  { path: 'university' },
];

const PROJECT_QUERY_CONFIG: MongooseQueryConfig<ProjectDocument> = {
  searchableFields: ['title'],
  filterableFields: {
    title: { type: 'string', operators: ['eq', 'in'] },
    project_type: { type: 'string', operators: ['eq', 'in'] },
    condition: { type: 'string', operators: ['eq', 'in'] },
    status: { type: 'string', operators: ['eq', 'in'] },
    reward_system: { type: 'boolean', operators: ['eq'] },
    survey_system: { type: 'boolean', operators: ['eq'] },
    is_active: { type: 'boolean', operators: ['eq'] },
    organizations: { type: 'objectId', operators: ['eq', 'in'] },
    school_district: { type: 'objectId', operators: ['eq', 'in'] },
    university: { type: 'objectId', operators: ['eq', 'in'] },
    createdAt: { type: 'date', operators: ['gte', 'lte'] },
    updatedAt: { type: 'date', operators: ['gte', 'lte'] },
  },
  allowedSortFields: [
    'title',
    'project_type',
    'condition',
    'status',
    'createdAt',
    'updatedAt',
  ],
  defaultSort: { createdAt: -1 },
  defaultPopulate: DEFAULT_PROJECT_POPULATE,
  defaultLimit: 25,
  maxLimit: 100,
  lean: false,
};

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
  ) {}

  async create(createDto: CreateProjectDto): Promise<ProjectDocument> {
    const projectType = createDto.project_type ?? ProjectType.SpecialProject;
    this.ensureAssociationRequirements({
      projectType,
      schoolDistrict: createDto.school_district,
      university: createDto.university,
    });

    const payload: Partial<Project> = {
      title: this.normalizeTitle(createDto.title),
      image: this.normalizeImage(createDto.image),
      project_type: projectType,
      condition: createDto.condition ?? ProjectCondition.Editable,
      status: createDto.status ?? ProjectStatus.Active,
      reward_system: createDto.reward_system ?? false,
      survey_system: createDto.survey_system ?? false,
      organizations: this.toObjectIdArray(createDto.organizations),
      is_active: createDto.is_active ?? true,
    };

    if (isSecondaryProjectType(projectType)) {
      payload.school_district = new Types.ObjectId(createDto.school_district);
      payload.university = undefined;
    } else if (isPostSecondaryProjectType(projectType)) {
      payload.university = new Types.ObjectId(createDto.university);
      payload.school_district = undefined;
    } else {
      payload.school_district = undefined;
      payload.university = undefined;
    }

    const project = new this.projectModel(payload);
    const savedProject = await project.save();
    await savedProject.populate(DEFAULT_PROJECT_POPULATE);
    return savedProject;
  }

  async findAll(
    rawQuery: Record<string, unknown> = {},
  ): Promise<ExecuteQueryResult<ProjectDocument>> {
    return executeMongooseQuery<ProjectDocument>({
      model: this.projectModel,
      rawQuery,
      config: PROJECT_QUERY_CONFIG,
    });
  }

  async findByOrganizationId(
    organizationId: string,
    rawQuery: Record<string, unknown> = {},
  ): Promise<ExecuteQueryResult<ProjectDocument>> {
    if (!Types.ObjectId.isValid(organizationId)) {
      throw new BadRequestException('Invalid organization id format.');
    }

    return executeMongooseQuery<ProjectDocument>({
      model: this.projectModel,
      rawQuery,
      config: PROJECT_QUERY_CONFIG,
      baseFilter: { organizations: new Types.ObjectId(organizationId) },
    });
  }

  async findOne(id: string): Promise<ProjectDocument> {
    const project = await this.projectModel
      .findById(id)
      .populate([
        {
          path: 'school_district',
          select: 'agancy_name state_name state_agancy_id',
        },
        { path: 'university' },
        {
          path: 'organizations',
          select: 'title organization_type is_active',
        },
      ])
      .exec();

    if (!project) {
      throw new NotFoundException(`Project with id "${id}" not found.`);
    }

    return project;
  }

  async update(
    id: string,
    updateDto: UpdateProjectDto,
  ): Promise<ProjectDocument> {
    const project = await this.projectModel.findById(id).exec();

    if (!project) {
      throw new NotFoundException(`Project with id "${id}" not found.`);
    }

    const nextType = updateDto.project_type ?? project.project_type;
    const nextSchoolDistrict =
      updateDto.school_district !== undefined
        ? updateDto.school_district
        : project.school_district?.toString();
    const nextUniversity =
      updateDto.university !== undefined
        ? updateDto.university
        : project.university?.toString();

    this.ensureAssociationRequirements({
      projectType: nextType,
      schoolDistrict: nextSchoolDistrict,
      university: nextUniversity,
    });

    if (updateDto.title !== undefined) {
      project.title = this.normalizeTitle(updateDto.title);
    }

    if (updateDto.image !== undefined) {
      project.image = this.normalizeImage(updateDto.image);
    }

    if (updateDto.project_type !== undefined) {
      project.project_type = updateDto.project_type;
    }

    if (updateDto.condition !== undefined) {
      project.condition = updateDto.condition;
    }

    if (updateDto.status !== undefined) {
      project.status = updateDto.status;
    }

    if (updateDto.reward_system !== undefined) {
      project.reward_system = updateDto.reward_system;
    }

    if (updateDto.survey_system !== undefined) {
      project.survey_system = updateDto.survey_system;
    }

    if (updateDto.organizations !== undefined) {
      if (!updateDto.organizations.length) {
        throw new BadRequestException(
          'organizations must contain at least one organization id.',
        );
      }
      project.organizations = this.toObjectIdArray(updateDto.organizations);
    }

    if (updateDto.is_active !== undefined) {
      project.is_active = updateDto.is_active;
    }

    if (isSecondaryProjectType(nextType)) {
      const schoolDistrictId =
        updateDto.school_district ?? project.school_district?.toString();
      project.school_district = new Types.ObjectId(schoolDistrictId);
      project.university = undefined;
    } else if (isPostSecondaryProjectType(nextType)) {
      const universityId =
        updateDto.university ?? project.university?.toString();
      project.university = new Types.ObjectId(universityId);
      project.school_district = undefined;
    } else {
      project.school_district = undefined;
      project.university = undefined;
    }

    await project.save();
    await project.populate(DEFAULT_PROJECT_POPULATE);
    return project;
  }

  async remove(id: string): Promise<ProjectDocument> {
    const project = await this.projectModel
      .findByIdAndDelete(id)
      .populate(DEFAULT_PROJECT_POPULATE)
      .exec();

    if (!project) {
      throw new NotFoundException(`Project with id "${id}" not found.`);
    }

    return project;
  }

  private ensureAssociationRequirements(args: {
    projectType: ProjectType;
    schoolDistrict?: string | Types.ObjectId | null;
    university?: string | Types.ObjectId | null;
  }): void {
    const { projectType, schoolDistrict, university } = args;

    if (isSecondaryProjectType(projectType) && !schoolDistrict) {
      throw new BadRequestException(
        'school_district is required when project_type targets secondary education.',
      );
    }

    if (isPostSecondaryProjectType(projectType) && !university) {
      throw new BadRequestException(
        'university is required when project_type targets post-secondary education.',
      );
    }
  }

  private normalizeTitle(value: string): string {
    return value.trim();
  }

  private normalizeImage(value?: string): string {
    if (value === undefined || value === null) {
      return '';
    }

    const trimmed = value.trim();
    return trimmed;
  }

  private toObjectIdArray(values: string[]): Types.ObjectId[] {
    const uniqueIds = Array.from(new Set(values));
    return uniqueIds.map((id) => new Types.ObjectId(id));
  }
}

function isSecondaryProjectType(projectType: ProjectType): boolean {
  return SECONDARY_TYPE_SET.has(projectType);
}

function isPostSecondaryProjectType(projectType: ProjectType): boolean {
  return POST_SECONDARY_TYPE_SET.has(projectType);
}
