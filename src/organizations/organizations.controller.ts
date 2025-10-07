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
  ApiBadRequestResponse,
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
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationsService } from './organizations.service';
import { Organization } from './schemas/organization.schema';
import { User } from '../users/schemas/user.schema';
import { SchoolDistrict } from '../school-districts/schemas/school-district.schema';
import { University } from '../universities/schemas/university.schema';

@ApiTags('organizations')
@ApiExtraModels(Organization, User, SchoolDistrict, University)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new organization' })
  @ApiCreatedResponse({
    type: Organization,
    description: 'Organization created successfully.',
  })
  @ApiBadRequestResponse({ description: 'Validation failed.' })
  create(@Body() createOrganizationDto: CreateOrganizationDto) {
    return this.organizationsService.create(createOrganizationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve a paginated list of organizations' })
  @ApiOkResponse({
    description: 'Organizations retrieved successfully.',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(Organization) },
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
    description: 'Full-text search applied to title and short_title. Alias: q.',
    example: 'academy',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    type: String,
    description: 'Comma separated sort definition. Prefix with - for descending. Allowed fields: title, short_title, organization_type, lead_contact, createdAt, updatedAt.',
    example: 'title,-createdAt',
  })
  @ApiQuery({
    name: 'filters',
    required: false,
    style: 'deepObject',
    explode: true,
    description: 'Filter definitions using deep object syntax, e.g. filters[organization_type]=secondary & filters[createdAt][gte]=2024-01-01. Supported fields: title, short_title, organization_type, lead_contact, ufcs_member, paid, reward_system, survey_system, school_district, university, is_active, createdAt, updatedAt. Operators vary per field: eq, in, nin, gt, gte, lt, lte.',
    schema: {
      type: 'object',
      additionalProperties: true,
    },
    example: {
      organization_type: 'secondary',
      createdAt: { 'gte': '2024-01-01' },
    },
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    type: String,
    description: 'JSON encoded filter definition. Same shape as filters but passed as a JSON string.',
    example: '{"organization_type":"secondary"}',
  })
  findAll(@Query() query: Record<string, unknown>) {
    return this.organizationsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve an organization by id' })
  @ApiParam({
    name: 'id',
    description: 'MongoDB identifier of the organization.',
  })
  @ApiOkResponse({
    description: 'Organization retrieved successfully.',
    schema: {
      allOf: [
        { $ref: getSchemaPath(Organization) },
        {
          type: 'object',
          properties: {
            lead_contact: { $ref: getSchemaPath(User) },
            school_district: {
              oneOf: [
                { $ref: getSchemaPath(SchoolDistrict) },
                { type: 'null' },
              ],
            },
            university: {
              oneOf: [
                { $ref: getSchemaPath(University) },
                { type: 'null' },
              ],
            },
          },
        },
      ],
    },
  })
  @ApiNotFoundResponse({ description: 'Organization not found.' })
  findOne(@Param('id') id: string) {
    return this.organizationsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing organization' })
  @ApiParam({
    name: 'id',
    description: 'MongoDB identifier of the organization.',
  })
  @ApiOkResponse({
    type: Organization,
    description: 'Organization updated successfully.',
  })
  @ApiNotFoundResponse({ description: 'Organization not found.' })
  @ApiBadRequestResponse({ description: 'Validation failed.' })
  update(
    @Param('id') id: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(id, updateOrganizationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove an organization by id' })
  @ApiParam({
    name: 'id',
    description: 'MongoDB identifier of the organization.',
  })
  @ApiOkResponse({
    type: Organization,
    description: 'Organization removed successfully.',
  })
  @ApiNotFoundResponse({ description: 'Organization not found.' })
  remove(@Param('id') id: string) {
    return this.organizationsService.remove(id);
  }
}
