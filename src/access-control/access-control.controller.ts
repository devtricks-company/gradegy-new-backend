import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { ExecuteQueryResult } from '../common/utils/mongoose-query.util';
import { CreateSubcategoryDto } from '../subcategories/dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from '../subcategories/dto/update-subcategory.dto';
import { Category } from '../categories/schemas/category.schema';
import { Organization } from '../organizations/schemas/organization.schema';
import { Project } from '../projects/schemas/project.schema';
import { Subcategory } from '../subcategories/schemas/subcategory.schema';
import { SubcategoriesService } from '../subcategories/subcategories.service';
import { User, UserRole } from '../users/schemas/user.schema';
import { CreateUserAssignmentDto } from './dto/create-user-assignment.dto';
import { RegisterStudentWithAccessDto } from './dto/register-student-with-access.dto';
import { UserAssignment } from './schemas/user-assignment.schema';
import { AccessControlService } from './access-control.service';
import { ScopedStudentWithAssignments } from './interfaces/scoped-student-with-assignments.interface';

@ApiTags('access-control')
@ApiExtraModels(UserAssignment, User)
@Controller('access')
export class AccessControlController {
  constructor(
    private readonly accessControlService: AccessControlService,
    private readonly subcategoriesService: SubcategoriesService,
  ) {}

  @Post('assignments')
  @Roles(UserRole.Ultra, UserRole.Super, UserRole.Admin)
  @ApiOperation({ summary: 'Assign scoped access to a user.' })
  @ApiCreatedResponse({ type: UserAssignment })
  async createAssignment(@Body() createDto: CreateUserAssignmentDto) {
    return this.accessControlService.createAssignment(createDto);
  }

  @Post('students')
  @Roles(UserRole.Ultra, UserRole.Super, UserRole.Admin)
  @ApiOperation({
    summary: 'Register a student and assign scoped access in a single request.',
  })
  @ApiCreatedResponse({
    description: 'Student account created with the requested assignments.',
    schema: {
      type: 'object',
      properties: {
        user: { $ref: getSchemaPath(User) },
        assignments: {
          type: 'array',
          items: { $ref: getSchemaPath(UserAssignment) },
        },
      },
    },
  })
  async registerStudentWithAccess(
    @Body() registerDto: RegisterStudentWithAccessDto,
  ) {
    return this.accessControlService.registerStudentWithAccess(registerDto);
  }

  @Get('students')
  @Roles(UserRole.Ultra, UserRole.Super, UserRole.Admin)
  @ApiOperation({
    summary: 'List students accessible to the current user within their scope.',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description:
      'Free text search applied to first name, last name, email, or phone.',
    type: String,
  })
  @ApiQuery({
    name: 'filters',
    required: false,
    description:
      'JSON object describing field filters (firstName, lastName, email, phone, isActive, createdAt, updatedAt).',
    schema: {
      type: 'string',
      example:
        '{"firstName":{"eq":"Dana"},"isActive":{"eq":true},"createdAt":{"gte":"2024-01-01"}}',
    },
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    description:
      'Comma separated list of sort fields, prefix with "-" for descending. Allowed: firstName, lastName, email, phone, createdAt, updatedAt.',
    schema: { type: 'string', example: 'lastName,-createdAt' },
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: '1-based page index for pagination.',
    schema: { type: 'integer', minimum: 1, example: 1 },
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of students per page (max 100).',
    schema: { type: 'integer', minimum: 1, maximum: 100, example: 25 },
  })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              user: { $ref: getSchemaPath(User) },
              assignments: {
                type: 'array',
                items: { $ref: getSchemaPath(UserAssignment) },
              },
            },
          },
        },
        meta: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 25 },
            totalItems: { type: 'integer', example: 100 },
            totalPages: { type: 'integer', example: 4 },
            hasNextPage: { type: 'boolean', example: true },
            hasPreviousPage: { type: 'boolean', example: false },
          },
        },
      },
    },
  })
  async listStudents(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: Record<string, unknown> = {},
  ): Promise<ExecuteQueryResult<ScopedStudentWithAssignments>> {
    return this.accessControlService.listStudentsForUser(user.id, query);
  }

  @Get('assignments/:userId')
  @Roles(UserRole.Ultra, UserRole.Super, UserRole.Admin)
  @ApiOperation({ summary: 'List assignments for a specific user.' })
  @ApiParam({
    name: 'userId',
    description: 'User identifier.',
    type: String,
  })
  @ApiOkResponse({ type: UserAssignment, isArray: true })
  async listAssignments(@Param('userId') userId: string) {
    return this.accessControlService.listAssignmentsForUser(userId);
  }

  @Delete('assignments/:assignmentId')
  @Roles(UserRole.Ultra, UserRole.Super, UserRole.Admin)
  @ApiOperation({ summary: 'Remove an assignment from a user.' })
  @ApiParam({
    name: 'assignmentId',
    description: 'Assignment identifier.',
    type: String,
  })
  @ApiOkResponse({ type: UserAssignment })
  async removeAssignment(@Param('assignmentId') assignmentId: string) {
    return this.accessControlService.removeAssignment(assignmentId);
  }

  @Get('organizations')
  @ApiOperation({
    summary: 'List organizations accessible to the current user.',
  })
  @ApiOkResponse({ type: Organization, isArray: true })
  async listOrganizations(@CurrentUser() user: AuthenticatedUser) {
    return this.accessControlService.listOrganizationsForUser(user.id);
  }

  @Get('projects')
  @ApiOperation({ summary: 'List projects the current user can access.' })
  @ApiOkResponse({ type: Project, isArray: true })
  async listProjects(@CurrentUser() user: AuthenticatedUser) {
    return this.accessControlService.listProjectsForUser(user.id);
  }

  @Get('categories')
  @ApiOperation({ summary: 'List categories accessible to the current user.' })
  @ApiOkResponse({ type: Category, isArray: true })
  @ApiQuery({
    name: 'projectId',
    required: false,
    description: 'Optional project id to further scope the results.',
    type: String,
  })
  async listCategories(
    @CurrentUser() user: AuthenticatedUser,
    @Query('projectId') projectId?: string,
  ) {
    return this.accessControlService.listCategoriesForUser(user.id, projectId);
  }

  @Get('subcategories')
  @ApiOperation({
    summary: 'List subcategories accessible to the current user.',
  })
  @ApiOkResponse({ type: Subcategory, isArray: true })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    description: 'Optional category id to filter the results.',
    type: String,
  })
  async listSubcategories(
    @CurrentUser() user: AuthenticatedUser,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.accessControlService.listSubcategoriesForUser(
      user.id,
      categoryId,
    );
  }

  @Get('subcategories/:id')
  @ApiOperation({
    summary: 'Get a subcategory if it is within the user scope.',
  })
  @ApiParam({
    name: 'id',
    description: 'Subcategory identifier.',
    type: String,
  })
  @ApiOkResponse({ type: Subcategory })
  async getSubcategory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    await this.accessControlService.ensureSubcategoryReadAccess(user.id, id);
    return this.subcategoriesService.findOne(id);
  }

  @Post('subcategories')
  @ApiOperation({ summary: 'Create a subcategory within the permitted scope.' })
  @ApiCreatedResponse({ type: Subcategory })
  async createSubcategory(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createDto: CreateSubcategoryDto,
  ) {
    await this.accessControlService.ensureCategoryWriteAccess(
      user.id,
      createDto.category,
    );

    const subcategory = await this.subcategoriesService.create(createDto);
    this.accessControlService.invalidateScopeForUser(user.id);
    return subcategory;
  }

  @Patch('subcategories/:id')
  @ApiOperation({ summary: 'Update a subcategory within the permitted scope.' })
  @ApiParam({
    name: 'id',
    description: 'Subcategory identifier.',
    type: String,
  })
  @ApiOkResponse({ type: Subcategory })
  async updateSubcategory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updateDto: UpdateSubcategoryDto,
  ) {
    await this.accessControlService.ensureSubcategoryWriteAccess(user.id, id);

    if (updateDto.category) {
      await this.accessControlService.ensureCategoryWriteAccess(
        user.id,
        updateDto.category,
      );
    }

    const subcategory = await this.subcategoriesService.update(id, updateDto);
    this.accessControlService.invalidateScopeForUser(user.id);
    return subcategory;
  }

  @Delete('subcategories/:id')
  @ApiOperation({ summary: 'Delete a subcategory within the permitted scope.' })
  @ApiParam({
    name: 'id',
    description: 'Subcategory identifier.',
    type: String,
  })
  @ApiOkResponse({ type: Subcategory })
  async deleteSubcategory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    await this.accessControlService.ensureSubcategoryWriteAccess(user.id, id);
    const subcategory = await this.subcategoriesService.remove(id);
    this.accessControlService.invalidateScopeForUser(user.id);
    return subcategory;
  }
}
