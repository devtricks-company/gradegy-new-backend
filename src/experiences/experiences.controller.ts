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
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';
import { Experience } from './schemas/experience.schema';
import { ExperiencesService } from './experiences.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { UserAssignment } from '../access-control/schemas/user-assignment.schema';
import { User, UserRole } from '../users/schemas/user.schema';
import type { ExecuteQueryResult } from '../common/utils/mongoose-query.util';
import { ExperienceStudentAccess } from './interfaces/experience-student-access.interface';

@ApiTags('experiences')
@ApiExtraModels(Experience, UserAssignment, User)
@Controller('experiences')
export class ExperiencesController {
  constructor(private readonly experiencesService: ExperiencesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new experience' })
  @ApiCreatedResponse({
    type: Experience,
    description: 'Experience created successfully.',
  })
  create(@Body() createExperienceDto: CreateExperienceDto) {
    return this.experiencesService.create(createExperienceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve a paginated list of experiences' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (1-based). Alias: currentPage.',
    schema: { type: 'integer', minimum: 1, example: 1 },
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description:
      'Maximum items per page. Aliases: pageSize, perPage, take. Maximum allowed: 100.',
    schema: { type: 'integer', minimum: 1, maximum: 100, example: 25 },
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Offset of the first item to return. Alias: skip.',
    schema: { type: 'integer', minimum: 0, example: 0 },
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    description:
      'Sort expression. Use comma separated fields (prefix with - for descending). Alias: orderBy. Allowed fields: title, sequence, start_date, end_date, delay_days, xp_completion, xp_view, gems, createdAt, updatedAt.',
    schema: { type: 'string', example: '-createdAt,sequence' },
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description:
      'Case-insensitive search term applied to the title, subtitle, and description fields. Alias: q.',
    schema: { type: 'string', example: 'Onboarding' },
  })
  @ApiQuery({
    name: 'filters',
    required: false,
    description:
      'Deep object filter map. Use filters[field] or filters[field][operator] syntax. Supported fields: experience_type, organization, project, category, subcategory, driver_one, driver_two, timing_type, delay_days, length_days, sequence, prerequisite, completion_required, end_with_parent, expPublish, completion_type, auto_complete, start_date, end_date, createdAt, updatedAt. Operators: eq, ne, gt, gte, lt, lte, in, nin (per field config).',
    style: 'deepObject',
    explode: true,
    schema: {
      type: 'object',
      additionalProperties: true,
      example: {
        sequence: { gte: 1 },
        organization: { in: ['64b0a1', '64b0a2'] },
        completion_required: { eq: true },
        start_date: { gte: '2024-01-01', lte: '2024-12-31' },
      },
    },
  })
  @ApiQuery({
    name: 'populate',
    required: false,
    description:
      'Comma separated relations to populate. Alias: populates. Allowed values: experience_type, organization, project, category, subcategory, prerequisite.',
    schema: { type: 'string', example: 'project,category' },
  })
  @ApiOkResponse({
    description: 'Experiences retrieved successfully.',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(Experience) },
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
  findAll(
    @Query() query: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.experiencesService.findAll(query, user);
  }

  @Get(':id/students')
  @Roles(UserRole.Ultra, UserRole.Super, UserRole.Admin)
  @ApiOperation({
    summary: 'List students who can access the specified experience.',
  })
  @ApiParam({
    name: 'id',
    description: 'Experience identifier.',
    type: String,
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
              user: {
                type: 'object',
                properties: {
                  _id: {
                    type: 'string',
                    description: 'Unique identifier of the student.',
                  },
                  firstName: {
                    type: 'string',
                    nullable: true,
                    description: 'Given name of the student.',
                  },
                  lastName: {
                    type: 'string',
                    nullable: true,
                    description: 'Family name of the student.',
                  },
                  email: {
                    type: 'string',
                    nullable: true,
                    description: 'Email address used for login.',
                  },
                  phone: {
                    type: 'string',
                    nullable: true,
                    description: 'Contact phone number.',
                  },
                  avatarUrl: {
                    type: 'string',
                    nullable: true,
                    description: 'Avatar image URL.',
                  },
                  role: {
                    type: 'string',
                    description: 'User role (always "student" in this response).',
                    example: 'student',
                  },
                  isActive: {
                    type: 'boolean',
                    description: 'Whether the student account is active.',
                  },
                  createdAt: {
                    type: 'string',
                    format: 'date-time',
                    description: 'Date when the account was created.',
                  },
                  updatedAt: {
                    type: 'string',
                    format: 'date-time',
                    description: 'Date when the account was last updated.',
                  },
                },
                additionalProperties: true,
              },
              assignments: {
                type: 'array',
                items: { $ref: getSchemaPath(UserAssignment) },
              },
              completed: {
                type: 'boolean',
                description: 'Whether the student has completed the experience.',
              },
              completedAt: {
                type: 'string',
                format: 'date-time',
                nullable: true,
                description:
                  'Completion timestamp when the experience was finished by the student.',
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
  async listStudentsWithAccess(
    @Param('id') id: string,
    @Query() query: Record<string, unknown> = {},
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ExecuteQueryResult<ExperienceStudentAccess>> {
    return this.experiencesService.listStudentsWithAccess(id, query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve an experience by id' })
  @ApiParam({
    name: 'id',
    description: 'MongoDB identifier of the experience.',
  })
  @ApiOkResponse({
    type: Experience,
    description: 'Experience retrieved successfully.',
  })
  @ApiNotFoundResponse({ description: 'Experience not found.' })
  findOne(@Param('id') id: string) {
    return this.experiencesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing experience' })
  @ApiParam({
    name: 'id',
    description: 'MongoDB identifier of the experience.',
  })
  @ApiOkResponse({
    type: Experience,
    description: 'Experience updated successfully.',
  })
  @ApiNotFoundResponse({ description: 'Experience not found.' })
  update(
    @Param('id') id: string,
    @Body() updateExperienceDto: UpdateExperienceDto,
  ) {
    return this.experiencesService.update(id, updateExperienceDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove an experience by id' })
  @ApiParam({
    name: 'id',
    description: 'MongoDB identifier of the experience.',
  })
  @ApiOkResponse({
    type: Experience,
    description: 'Experience removed successfully.',
  })
  @ApiNotFoundResponse({ description: 'Experience not found.' })
  remove(@Param('id') id: string) {
    return this.experiencesService.remove(id);
  }
}
