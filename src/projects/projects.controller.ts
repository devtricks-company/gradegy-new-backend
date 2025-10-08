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
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project } from './schemas/project.schema';
import { ProjectsService } from './projects.service';

@ApiTags('projects')
@ApiExtraModels(Project)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  @ApiCreatedResponse({
    type: Project,
    description: 'Project created successfully.',
  })
  create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(createProjectDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve a paginated list of projects' })
  @ApiOkResponse({
    description: 'Projects retrieved successfully.',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(Project) },
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
  findAll(@Query() query: Record<string, unknown>) {
    return this.projectsService.findAll(query);
  }

  @Get('organization/:organizationId')
  @ApiOperation({ summary: 'Retrieve projects by organization id' })
  @ApiParam({
    name: 'organizationId',
    description: 'MongoDB identifier of the organization.',
  })
  @ApiOkResponse({
    description: 'Projects retrieved successfully.',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(Project) },
        },
        meta: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 25 },
            totalItems: { type: 'integer', example: 50 },
            totalPages: { type: 'integer', example: 2 },
            hasNextPage: { type: 'boolean', example: false },
            hasPreviousPage: { type: 'boolean', example: false },
          },
        },
      },
    },
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number to retrieve (>= 1). Alias: currentPage.',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page. Aliases: pageSize, perPage, take.',
    example: 25,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of records to skip before fetching results. Alias: skip.',
    example: 0,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Free-text search applied to project title. Alias: q.',
    example: 'literacy',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    type: String,
    description:
      'Comma separated sort definition. Prefix with - for descending. Allowed fields: title, project_type, condition, status, createdAt, updatedAt. Alias: orderBy.',
    example: 'title,-createdAt',
  })
  @ApiQuery({
    name: 'filters',
    required: false,
    style: 'deepObject',
    explode: true,
    description:
      'Filter definitions using deep object syntax, e.g. filters[status]=Active & filters[createdAt][gte]=2024-01-01. Supported fields: title, project_type, condition, status, reward_system, survey_system, is_active, organizations, school_district, university, createdAt, updatedAt. Operators vary per field and include eq, in, gte, lte.',
    schema: {
      type: 'object',
      additionalProperties: true,
    },
    example: {
      status: 'Active',
      createdAt: { gte: '2024-01-01' },
    },
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    type: String,
    description:
      'JSON encoded filter definition. Same shape as filters but passed as a JSON string.',
    example: '{"status":["Active","Planned"]}',
  })
  findByOrganization(
    @Param('organizationId') organizationId: string,
    @Query() query: Record<string, unknown>,
  ) {
    return this.projectsService.findByOrganizationId(organizationId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a project by id' })
  @ApiParam({
    name: 'id',
    description: 'MongoDB identifier of the project.',
  })
  @ApiOkResponse({
    type: Project,
    description: 'Project retrieved successfully.',
  })
  @ApiNotFoundResponse({ description: 'Project not found.' })
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing project' })
  @ApiParam({
    name: 'id',
    description: 'MongoDB identifier of the project.',
  })
  @ApiOkResponse({
    type: Project,
    description: 'Project updated successfully.',
  })
  @ApiNotFoundResponse({ description: 'Project not found.' })
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a project by id' })
  @ApiParam({
    name: 'id',
    description: 'MongoDB identifier of the project.',
  })
  @ApiOkResponse({
    type: Project,
    description: 'Project removed successfully.',
  })
  @ApiNotFoundResponse({ description: 'Project not found.' })
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }
}
