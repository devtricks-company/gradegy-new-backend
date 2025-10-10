import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, PopulateOptions, Types } from 'mongoose';
import { hash } from 'bcryptjs';
import {
  Category,
  CategoryDocument,
} from '../categories/schemas/category.schema';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';
import {
  Organization,
  OrganizationDocument,
} from '../organizations/schemas/organization.schema';
import {
  Subcategory,
  SubcategoryDocument,
} from '../subcategories/schemas/subcategory.schema';
import { User, UserDocument, UserRole } from '../users/schemas/user.schema';
import {
  ExecuteQueryResult,
  MongooseQueryConfig,
  executeMongooseQuery,
} from '../common/utils/mongoose-query.util';
import { AccessScope } from './interfaces/access-scope.interface';
import { ScopedStudentWithAssignments } from './interfaces/scoped-student-with-assignments.interface';
import { CreateUserAssignmentDto } from './dto/create-user-assignment.dto';
import { RegisterStudentWithAccessDto } from './dto/register-student-with-access.dto';
import {
  UserAssignment,
  UserAssignmentDocument,
} from './schemas/user-assignment.schema';

const PROJECT_SCOPE_POPULATE: PopulateOptions[] = [
  { path: 'organizations', select: 'title organization_type is_active' },
  {
    path: 'school_district',
    select: 'agancy_name state_name state_agancy_id',
  },
  { path: 'university' },
];

const CATEGORY_SCOPE_POPULATE: PopulateOptions[] = [
  { path: 'project', select: 'title status is_active' },
  {
    path: 'highschool',
    select: 'school_name school_id school_level is_active',
  },
];

const SUBCATEGORY_SCOPE_POPULATE: PopulateOptions[] = [
  { path: 'category', select: 'title is_active project' },
];

const USER_ASSIGNMENT_POPULATE: PopulateOptions[] = [
  { path: 'organization', select: 'title organization_type is_active' },
  { path: 'project', select: 'title status is_active' },
  { path: 'category', select: 'title is_active project' },
  { path: 'subcategory', select: 'title is_active category' },
];

const BCRYPT_SALT_ROUNDS = 12;

const STUDENT_QUERY_CONFIG: MongooseQueryConfig<UserDocument> = {
  searchableFields: ['firstName', 'lastName', 'email', 'phone'],
  filterableFields: {
    firstName: { type: 'string', operators: ['eq', 'in'] },
    lastName: { type: 'string', operators: ['eq', 'in'] },
    email: { type: 'string', operators: ['eq', 'in'] },
    phone: { type: 'string', operators: ['eq', 'in'] },
    isActive: { type: 'boolean', operators: ['eq'] },
    createdAt: { type: 'date', operators: ['gte', 'lte'] },
    updatedAt: { type: 'date', operators: ['gte', 'lte'] },
  },
  allowedSortFields: [
    'firstName',
    'lastName',
    'email',
    'phone',
    'createdAt',
    'updatedAt',
  ],
  defaultSort: { lastName: 1, firstName: 1, email: 1 },
  defaultLimit: 25,
  maxLimit: 100,
  lean: false,
};

interface MutableAccessScope {
  organizationIds: Set<string>;
  orgWideOrganizationIds: Set<string>;
  projectIds: Set<string>;
  categoryIds: Set<string>;
  subcategoryIds: Set<string>;
}

@Injectable()
export class AccessControlService {
  private readonly scopeCache = new Map<string, Promise<AccessScope>>();

  constructor(
    @InjectModel(UserAssignment.name)
    private readonly assignmentModel: Model<UserAssignmentDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Organization.name)
    private readonly organizationModel: Model<OrganizationDocument>,
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(Subcategory.name)
    private readonly subcategoryModel: Model<SubcategoryDocument>,
  ) {}

  async createAssignment(
    dto: CreateUserAssignmentDto,
  ): Promise<UserAssignmentDocument> {
    const userId = this.normalizeId(dto.user, 'user');
    const organizationId = this.normalizeId(dto.organization, 'organization');
    const projectId =
      dto.project !== undefined && dto.project !== null
        ? this.normalizeId(dto.project, 'project')
        : null;
    const categoryId =
      dto.category !== undefined && dto.category !== null
        ? this.normalizeId(dto.category, 'category')
        : null;
    const subcategoryId =
      dto.subcategory !== undefined && dto.subcategory !== null
        ? this.normalizeId(dto.subcategory, 'subcategory')
        : null;

    if (!projectId && (categoryId || subcategoryId)) {
      throw new BadRequestException(
        'Assigning a category or subcategory requires a project id.',
      );
    }

    if (!categoryId && subcategoryId) {
      throw new BadRequestException(
        'Assigning a subcategory requires a category id.',
      );
    }

    await this.ensureUserExists(userId);
    await this.ensureOrganizationExists(organizationId);

    if (projectId) {
      await this.ensureProjectBelongsToOrganization(projectId, organizationId);
    }

    if (categoryId && projectId) {
      await this.ensureCategoryBelongsToProject(categoryId, projectId);
    }

    if (subcategoryId && categoryId) {
      await this.ensureSubcategoryBelongsToCategory(subcategoryId, categoryId);
    }

    const payload: Partial<UserAssignment> = {
      user: this.toObjectId(userId, 'user'),
      organization: this.toObjectId(organizationId, 'organization'),
    };

    if (projectId) {
      payload.project = this.toObjectId(projectId, 'project');
    }

    if (categoryId) {
      payload.category = this.toObjectId(categoryId, 'category');
    }

    if (subcategoryId) {
      payload.subcategory = this.toObjectId(subcategoryId, 'subcategory');
    }

    try {
      const assignment = await new this.assignmentModel(payload).save();
      this.invalidateScopeForUser(userId);
      return assignment;
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        throw new BadRequestException(
          'An identical assignment already exists for this user.',
        );
      }
      throw error;
    }
  }

  async registerStudentWithAccess(
    dto: RegisterStudentWithAccessDto,
  ): Promise<{
    user: Record<string, unknown>;
    assignments: UserAssignmentDocument[];
  }> {
    const normalizedEmail = dto.student.email.toLowerCase();
    const existingUser = await this.userModel
      .findOne({ email: normalizedEmail })
      .exec();

    if (existingUser) {
      throw new ConflictException(
        `User with email "${normalizedEmail}" already exists.`,
      );
    }

    const hashedPassword = await hash(
      dto.student.password,
      BCRYPT_SALT_ROUNDS,
    );

    const userDocument = await new this.userModel({
      firstName: dto.student.firstName,
      lastName: dto.student.lastName,
      email: normalizedEmail,
      password: hashedPassword,
      phone: dto.student.phone,
      avatarUrl: dto.student.avatarUrl,
      role: UserRole.Student,
      isActive: dto.student.isActive ?? true,
    }).save();

    const createdAssignments: UserAssignmentDocument[] = [];

    try {
      for (const assignment of dto.assignments) {
        const createdAssignment = await this.createAssignment({
          user: userDocument.id,
          organization: assignment.organization,
          project: assignment.project,
          category: assignment.category,
          subcategory: assignment.subcategory,
        });
        createdAssignments.push(createdAssignment);
      }
    } catch (error) {
      await Promise.all([
        this.assignmentModel
          .deleteMany({ user: userDocument._id })
          .exec()
          .catch(() => undefined),
        this.userModel
          .findByIdAndDelete(userDocument._id)
          .exec()
          .catch(() => undefined),
      ]);
      throw error;
    }

    const populatedAssignments = await Promise.all(
      createdAssignments.map((assignment) =>
        assignment.populate(USER_ASSIGNMENT_POPULATE),
      ),
    );

    return {
      user: this.sanitizeUserDocument(userDocument),
      assignments: populatedAssignments,
    };
  }

  async listAssignmentsForUser(
    userId: string,
  ): Promise<UserAssignmentDocument[]> {
    const normalizedId = this.normalizeId(userId, 'user');
    await this.ensureUserExists(normalizedId);

    return this.assignmentModel
      .find({ user: this.toObjectId(normalizedId, 'user') })
      .sort({ createdAt: -1 })
      .populate(USER_ASSIGNMENT_POPULATE)
      .exec();
  }

  async removeAssignment(
    assignmentId: string,
  ): Promise<UserAssignmentDocument> {
    const normalizedId = this.normalizeId(assignmentId, 'assignment');

    const assignment = await this.assignmentModel
      .findByIdAndDelete(this.toObjectId(normalizedId, 'assignment'))
      .populate(USER_ASSIGNMENT_POPULATE)
      .exec();

    if (!assignment) {
      throw new BadRequestException(
        `Assignment with id "${assignmentId}" not found.`,
      );
    }

    const userId = this.extractId(assignment.user);
    if (userId) {
      this.invalidateScopeForUser(userId);
    }

    return assignment;
  }

  async listStudentsForUser(
    userId: string,
    rawQuery: Record<string, unknown> = {},
  ): Promise<ExecuteQueryResult<ScopedStudentWithAssignments>> {
    const scope = await this.getAccessScope(userId);

    const filters: Record<string, unknown>[] = [];

    if (scope.orgWideOrganizationIds.size) {
      filters.push({
        organization: {
          $in: this.toObjectIdArray(scope.orgWideOrganizationIds),
        },
      });
    }

    if (scope.projectIds.size) {
      filters.push({
        project: { $in: this.toObjectIdArray(scope.projectIds) },
      });
    }

    if (scope.categoryIds.size) {
      filters.push({
        category: { $in: this.toObjectIdArray(scope.categoryIds) },
      });
    }

    if (scope.subcategoryIds.size) {
      filters.push({
        subcategory: { $in: this.toObjectIdArray(scope.subcategoryIds) },
      });
    }

    const studentIdSet = new Set<string>();

    if (filters.length) {
      const distinctUserIds = await this.assignmentModel.distinct('user', {
        $or: filters,
      });

      for (const id of distinctUserIds) {
        const normalizedId = this.extractId(id as Types.ObjectId | string);
        if (normalizedId) {
          studentIdSet.add(normalizedId);
        }
      }
    }

    const baseFilter: FilterQuery<UserDocument> = {
      role: UserRole.Student,
      _id: { $in: this.toObjectIdArray(studentIdSet) },
    };

    const queryResult = await executeMongooseQuery<UserDocument>({
      model: this.userModel,
      rawQuery,
      baseFilter,
      config: STUDENT_QUERY_CONFIG,
    });

    const studentIds = queryResult.data
      .map((student) =>
        this.extractId(
          (student._id as Types.ObjectId | string | undefined) ?? undefined,
        ),
      )
      .filter((id): id is string => Boolean(id));

    const assignments =
      studentIds.length > 0
        ? await this.assignmentModel
            .find({
              user: { $in: this.toObjectIdArray(studentIds) },
              ...(filters.length ? { $or: filters } : {}),
            })
            .populate(USER_ASSIGNMENT_POPULATE)
            .exec()
        : [];

    const assignmentsByStudent = new Map<string, Record<string, unknown>[]>();

    for (const assignment of assignments) {
      const assignmentUserId = this.extractId(assignment.user);
      if (!assignmentUserId) {
        continue;
      }

      const sanitizedAssignment = this.sanitizeAssignmentDocument(assignment);
      const existing = assignmentsByStudent.get(assignmentUserId);

      if (existing) {
        existing.push(sanitizedAssignment);
      } else {
        assignmentsByStudent.set(assignmentUserId, [sanitizedAssignment]);
      }
    }

    const data: ScopedStudentWithAssignments[] = queryResult.data.map(
      (student) => {
        const studentId =
          this.extractId(
            (student._id as Types.ObjectId | string | undefined) ?? undefined,
          ) ?? '';
        return {
          user: this.sanitizeUserDocument(student),
          assignments: assignmentsByStudent.get(studentId) ?? [],
        };
      },
    );

    return {
      data,
      meta: queryResult.meta,
    };
  }

  async listOrganizationsForUser(
    userId: string,
  ): Promise<OrganizationDocument[]> {
    const scope = await this.getAccessScope(userId);

    if (!scope.organizationIds.size) {
      return [];
    }

    const organizationIds = this.toObjectIdArray(scope.organizationIds);
    return this.organizationModel
      .find({ _id: { $in: organizationIds } })
      .sort({ title: 1 })
      .exec();
  }

  async listProjectsForUser(userId: string): Promise<ProjectDocument[]> {
    const scope = await this.getAccessScope(userId);
    if (!scope.projectIds.size) {
      return [];
    }

    const projectIds = this.toObjectIdArray(scope.projectIds);
    return this.projectModel
      .find({ _id: { $in: projectIds } })
      .sort({ title: 1 })
      .populate(PROJECT_SCOPE_POPULATE)
      .exec();
  }

  async listCategoriesForUser(
    userId: string,
    projectId?: string,
  ): Promise<CategoryDocument[]> {
    const scope = await this.getAccessScope(userId);

    if (projectId) {
      const normalizedProjectId = this.normalizeId(projectId, 'project');
      this.ensureProjectInScope(scope, normalizedProjectId, 'read');
    }

    if (!scope.categoryIds.size) {
      return [];
    }

    const allowedCategoryIds = this.toObjectIdArray(scope.categoryIds);
    const filter: Record<string, unknown> = {
      _id: { $in: allowedCategoryIds },
    };

    if (projectId) {
      filter.project = this.toObjectId(projectId, 'project');
    }

    return this.categoryModel
      .find(filter)
      .sort({ title: 1 })
      .populate(CATEGORY_SCOPE_POPULATE)
      .exec();
  }

  async ensureCategoryReadAccess(
    userId: string,
    categoryId: string,
  ): Promise<void> {
    const scope = await this.getAccessScope(userId);
    const normalizedId = this.normalizeId(categoryId, 'category');
    this.ensureCategoryInScope(scope, normalizedId, 'read');
  }

  async ensureCategoryWriteAccess(
    userId: string,
    categoryId: string,
  ): Promise<void> {
    const scope = await this.getAccessScope(userId);
    const normalizedId = this.normalizeId(categoryId, 'category');
    this.ensureCategoryInScope(scope, normalizedId, 'write');
  }

  async ensureSubcategoryReadAccess(
    userId: string,
    subcategoryId: string,
  ): Promise<void> {
    const scope = await this.getAccessScope(userId);
    const normalizedId = this.normalizeId(subcategoryId, 'subcategory');
    this.ensureSubcategoryInScope(scope, normalizedId, 'read');
  }

  async ensureSubcategoryWriteAccess(
    userId: string,
    subcategoryId: string,
  ): Promise<void> {
    const scope = await this.getAccessScope(userId);
    const normalizedId = this.normalizeId(subcategoryId, 'subcategory');
    this.ensureSubcategoryInScope(scope, normalizedId, 'write');
  }

  async ensureProjectWriteAccessForOrganizations(
    userId: string,
    organizationIds: string[],
  ): Promise<void> {
    if (!organizationIds.length) {
      throw new BadRequestException(
        'At least one organization id must be provided.',
      );
    }

    const scope = await this.getAccessScope(userId);

    for (const organizationId of organizationIds) {
      const normalizedId = this.normalizeId(organizationId, 'organization');
      if (!scope.orgWideOrganizationIds.has(normalizedId)) {
        throw new ForbiddenException(
          `Access denied for organization "${normalizedId}" when creating or assigning a project.`,
        );
      }
    }
  }

  async listSubcategoriesForUser(
    userId: string,
    categoryId?: string,
  ): Promise<SubcategoryDocument[]> {
    const scope = await this.getAccessScope(userId);

    if (categoryId) {
      const normalizedCategoryId = this.normalizeId(categoryId, 'category');
      this.ensureCategoryInScope(scope, normalizedCategoryId, 'read');
    }

    if (!scope.subcategoryIds.size) {
      return [];
    }

    const allowedIds = this.toObjectIdArray(scope.subcategoryIds);
    const filter: Record<string, unknown> = { _id: { $in: allowedIds } };

    if (categoryId) {
      filter.category = this.toObjectId(categoryId, 'category');
    }

    return this.subcategoryModel
      .find(filter)
      .sort({ title: 1 })
      .populate(SUBCATEGORY_SCOPE_POPULATE)
      .exec();
  }

  invalidateScopeForUser(userId: string): void {
    this.scopeCache.delete(userId);
  }

  async getAccessScope(userId: string): Promise<AccessScope> {
    const normalizedId = this.normalizeId(userId, 'user');

    let cached = this.scopeCache.get(normalizedId);
    if (!cached) {
      cached = this.buildAccessScope(normalizedId).catch((error) => {
        this.scopeCache.delete(normalizedId);
        throw error;
      });
      this.scopeCache.set(normalizedId, cached);
    }

    return cached;
  }

  private async buildAccessScope(userId: string): Promise<AccessScope> {
    const user = await this.userModel
      .findById(this.toObjectId(userId, 'user'))
      .select('role')
      .lean()
      .exec();

    if (!user) {
      throw new BadRequestException(`User with id "${userId}" not found.`);
    }

    if (user.role === UserRole.Ultra) {
      return this.buildUltraAccessScope();
    }

    const assignments = await this.assignmentModel
      .find({ user: this.toObjectId(userId, 'user') })
      .lean()
      .exec();

    const scope: MutableAccessScope = {
      organizationIds: new Set<string>(),
      orgWideOrganizationIds: new Set<string>(),
      projectIds: new Set<string>(),
      categoryIds: new Set<string>(),
      subcategoryIds: new Set<string>(),
    };

    if (!assignments.length) {
      return this.freezeScope(scope);
    }

    for (const assignment of assignments) {
      const organizationId = this.extractId(assignment.organization);
      if (organizationId) {
        scope.organizationIds.add(organizationId);
      }

      const projectId = this.extractId(assignment.project);
      const categoryId = this.extractId(assignment.category);
      const subcategoryId = this.extractId(assignment.subcategory);

      if (!projectId) {
        if (organizationId) {
          scope.orgWideOrganizationIds.add(organizationId);
        }
        continue;
      }

      scope.projectIds.add(projectId);

      if (!categoryId) {
        continue;
      }

      scope.categoryIds.add(categoryId);

      if (!subcategoryId) {
        continue;
      }

      scope.subcategoryIds.add(subcategoryId);
    }

    if (user.role === UserRole.Super) {
      for (const organizationId of scope.organizationIds) {
        scope.orgWideOrganizationIds.add(organizationId);
      }
    }

    await this.expandFromOrganizations(scope);
    await this.expandFromProjects(scope);
    await this.expandFromCategories(scope);

    return this.freezeScope(scope);
  }

  private async buildUltraAccessScope(): Promise<AccessScope> {
    const [organizations, projects, categories, subcategories] =
      await Promise.all([
        this.organizationModel.find().select('_id').lean().exec(),
        this.projectModel.find().select('_id').lean().exec(),
        this.categoryModel.find().select('_id').lean().exec(),
        this.subcategoryModel.find().select('_id').lean().exec(),
      ]);

    const scope: MutableAccessScope = {
      organizationIds: new Set<string>(),
      orgWideOrganizationIds: new Set<string>(),
      projectIds: new Set<string>(),
      categoryIds: new Set<string>(),
      subcategoryIds: new Set<string>(),
    };

    for (const organization of organizations) {
      const id = this.extractId(organization._id);
      if (id) {
        scope.organizationIds.add(id);
        scope.orgWideOrganizationIds.add(id);
      }
    }

    for (const project of projects) {
      const id = this.extractId(project._id);
      if (id) {
        scope.projectIds.add(id);
      }
    }

    for (const category of categories) {
      const id = this.extractId(category._id);
      if (id) {
        scope.categoryIds.add(id);
      }
    }

    for (const subcategory of subcategories) {
      const id = this.extractId(subcategory._id);
      if (id) {
        scope.subcategoryIds.add(id);
      }
    }

    return this.freezeScope(scope);
  }

  private async expandFromOrganizations(
    scope: MutableAccessScope,
  ): Promise<void> {
    if (!scope.orgWideOrganizationIds.size) {
      return;
    }

    const organizationObjectIds = this.toObjectIdArray(
      scope.orgWideOrganizationIds,
    );
    const projects = await this.projectModel
      .find({ organizations: { $in: organizationObjectIds } })
      .select('_id')
      .lean()
      .exec();

    for (const project of projects) {
      const id = this.extractId(project._id);
      if (id) {
        scope.projectIds.add(id);
      }
    }
  }

  private async expandFromProjects(scope: MutableAccessScope): Promise<void> {
    if (!scope.projectIds.size) {
      return;
    }

    const projectObjectIds = this.toObjectIdArray(scope.projectIds);
    const categories = await this.categoryModel
      .find({ project: { $in: projectObjectIds } })
      .select('_id')
      .lean()
      .exec();

    for (const category of categories) {
      const id = this.extractId(category._id);
      if (id) {
        scope.categoryIds.add(id);
      }
    }
  }

  private async expandFromCategories(scope: MutableAccessScope): Promise<void> {
    if (!scope.categoryIds.size) {
      return;
    }

    const categoryObjectIds = this.toObjectIdArray(scope.categoryIds);
    const subcategories = await this.subcategoryModel
      .find({ category: { $in: categoryObjectIds } })
      .select('_id')
      .lean()
      .exec();

    for (const subcategory of subcategories) {
      const id = this.extractId(subcategory._id);
      if (id) {
        scope.subcategoryIds.add(id);
      }
    }
  }

  private async ensureUserExists(userId: string): Promise<void> {
    const exists = await this.userModel.exists({
      _id: this.toObjectId(userId, 'user'),
    });

    if (!exists) {
      throw new BadRequestException(`User with id "${userId}" not found.`);
    }
  }

  private async ensureOrganizationExists(
    organizationId: string,
  ): Promise<void> {
    const exists = await this.organizationModel.exists({
      _id: this.toObjectId(organizationId, 'organization'),
    });

    if (!exists) {
      throw new BadRequestException(
        `Organization with id "${organizationId}" not found.`,
      );
    }
  }

  private async ensureProjectBelongsToOrganization(
    projectId: string,
    organizationId: string,
  ): Promise<void> {
    const project = await this.projectModel
      .findById(this.toObjectId(projectId, 'project'))
      .select('organizations')
      .lean()
      .exec();

    if (!project) {
      throw new BadRequestException(
        `Project with id "${projectId}" not found.`,
      );
    }

    const projectOrganizations =
      (project.organizations as (Types.ObjectId | string)[] | undefined) ?? [];
    const projectOrganizationIds = projectOrganizations
      .map((organization) => this.extractId(organization))
      .filter((id): id is string => Boolean(id));

    if (!projectOrganizationIds.includes(organizationId)) {
      throw new BadRequestException(
        `Project "${projectId}" does not belong to organization "${organizationId}".`,
      );
    }
  }

  private async ensureCategoryBelongsToProject(
    categoryId: string,
    projectId: string,
  ): Promise<void> {
    const category = await this.categoryModel
      .findById(this.toObjectId(categoryId, 'category'))
      .select('project')
      .lean()
      .exec();

    if (!category) {
      throw new BadRequestException(
        `Category with id "${categoryId}" not found.`,
      );
    }

    const categoryProjectId = this.extractId(
      (category.project as Types.ObjectId | string | undefined) ?? undefined,
    );

    if (!categoryProjectId) {
      throw new BadRequestException(
        `Category "${categoryId}" is missing its project reference.`,
      );
    }

    if (categoryProjectId !== projectId) {
      throw new BadRequestException(
        `Category "${categoryId}" does not belong to project "${projectId}".`,
      );
    }
  }

  private async ensureSubcategoryBelongsToCategory(
    subcategoryId: string,
    categoryId: string,
  ): Promise<void> {
    const subcategory = await this.subcategoryModel
      .findById(this.toObjectId(subcategoryId, 'subcategory'))
      .select('category')
      .lean()
      .exec();

    if (!subcategory) {
      throw new BadRequestException(
        `Subcategory with id "${subcategoryId}" not found.`,
      );
    }

    const subcategoryCategoryId = this.extractId(
      (subcategory.category as Types.ObjectId | string | undefined) ??
        undefined,
    );

    if (!subcategoryCategoryId) {
      throw new BadRequestException(
        `Subcategory "${subcategoryId}" is missing its category reference.`,
      );
    }

    if (subcategoryCategoryId !== categoryId) {
      throw new BadRequestException(
        `Subcategory "${subcategoryId}" does not belong to category "${categoryId}".`,
      );
    }
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: unknown }).code === 11000
    );
  }

  private freezeScope(scope: MutableAccessScope): AccessScope {
    const readonlyScope: AccessScope = {
      organizationIds: new Set(scope.organizationIds),
      orgWideOrganizationIds: new Set(scope.orgWideOrganizationIds),
      projectIds: new Set(scope.projectIds),
      categoryIds: new Set(scope.categoryIds),
      subcategoryIds: new Set(scope.subcategoryIds),
    };

    return Object.freeze(readonlyScope);
  }

  private ensureProjectInScope(
    scope: AccessScope,
    projectId: string,
    action: 'read' | 'write',
  ): void {
    if (!scope.projectIds.has(projectId)) {
      throw new ForbiddenException(
        `You do not have ${action} access to project "${projectId}".`,
      );
    }
  }

  private ensureCategoryInScope(
    scope: AccessScope,
    categoryId: string,
    action: 'read' | 'write',
  ): void {
    if (!scope.categoryIds.has(categoryId)) {
      throw new ForbiddenException(
        `You do not have ${action} access to category "${categoryId}".`,
      );
    }
  }

  private ensureSubcategoryInScope(
    scope: AccessScope,
    subcategoryId: string,
    action: 'read' | 'write',
  ): void {
    if (!scope.subcategoryIds.has(subcategoryId)) {
      throw new ForbiddenException(
        `You do not have ${action} access to subcategory "${subcategoryId}".`,
      );
    }
  }

  private toObjectIdArray(values: Iterable<string>): Types.ObjectId[] {
    return Array.from(new Set(values)).map((value) => this.toObjectId(value));
  }

  private toObjectId(value: string, label = 'id'): Types.ObjectId {
    const normalized = this.normalizeId(value, label);
    return new Types.ObjectId(normalized);
  }

  private normalizeId(value: string, label: string): string {
    if (!value) {
      throw new BadRequestException(`The ${label} id must be provided.`);
    }

    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException(`The ${label} id "${value}" is invalid.`);
    }

    return new Types.ObjectId(value).toHexString();
  }

  private extractId(
    id: Types.ObjectId | string | undefined | null,
  ): string | null {
    if (!id) {
      return null;
    }

    if (id instanceof Types.ObjectId) {
      return id.toHexString();
    }

    return new Types.ObjectId(id).toHexString();
  }

  private sanitizeAssignmentDocument(
    assignment: UserAssignmentDocument,
  ): Record<string, unknown> {
    const assignmentObject = assignment.toObject({ versionKey: false });
    delete (assignmentObject as { user?: unknown }).user;
    return assignmentObject;
  }

  private sanitizeUserDocument(user: UserDocument): Record<string, unknown> {
    const userObject = user.toObject({ versionKey: false });
    delete (userObject as { password?: string }).password;
    userObject._id = user._id;
    return userObject;
  }
}
