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
import { CreateUniversityDto } from './dto/create-university.dto';
import { UpdateUniversityDto } from './dto/update-university.dto';
import { UniversitiesService } from './universities.service';
import { ExecuteQueryResult } from '../common/utils/mongoose-query.util';
import { University, UniversityDocument } from './schemas/university.schema';

@ApiTags('universities')
@ApiExtraModels(University)
@Controller('universities')
export class UniversitiesController {
  constructor(private readonly universitiesService: UniversitiesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new university record' })
  @ApiCreatedResponse({
    type: University,
    description: 'University created successfully.',
  })
  @ApiBadRequestResponse({ description: 'Validation failed.' })
  create(@Body() createUniversityDto: CreateUniversityDto) {
    return this.universitiesService.create(createUniversityDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve a paginated list of universities' })
  @ApiOkResponse({
    description: 'Universities retrieved successfully.',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(University) },
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
    description:
      'Number of records to skip before fetching results. Alias: skip.',
    example: 0,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description:
      'Full-text search applied to instnm, united_id, city, county_name. Alias: q.',
    example: 'Massachusetts',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    type: String,
    description:
      'Comma separated sort definition. Prefix with - for descending. Allowed fields: instnm, united_id, city, stabbr, county_name, createdAt, updatedAt.',
    example: 'instnm,-createdAt',
  })
  @ApiQuery({
    name: 'filters',
    required: false,
    style: 'deepObject',
    explode: true,
    description:
      'Filter definitions using deep object syntax, e.g. filters[stabbr]=MA & filters[createdAt][gte]=2024-01-01. Supported fields: united_id, instnm, city, stabbr, zip, county_name, active, createdAt, updatedAt.',
    schema: {
      type: 'object',
      additionalProperties: true,
    },
    example: {
      stabbr: 'MA',
      zip: { in: ['02139', '10027'] },
      active: true,
      createdAt: { gte: '2024-01-01' },
    },
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    type: String,
    description:
      'JSON encoded filter definition. Same shape as filters but passed as a JSON string.',
    example: '{"active":true}',
  })
  findAll(
    @Query() query: Record<string, unknown>,
  ): Promise<ExecuteQueryResult<UniversityDocument>> {
    return this.universitiesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a university by id' })
  @ApiParam({
    name: 'id',
    description: 'MongoDB identifier of the university.',
  })
  @ApiOkResponse({
    type: University,
    description: 'University retrieved successfully.',
  })
  @ApiNotFoundResponse({ description: 'University not found.' })
  findOne(@Param('id') id: string) {
    return this.universitiesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing university record' })
  @ApiParam({
    name: 'id',
    description: 'MongoDB identifier of the university.',
  })
  @ApiOkResponse({
    type: University,
    description: 'University updated successfully.',
  })
  @ApiNotFoundResponse({ description: 'University not found.' })
  @ApiBadRequestResponse({ description: 'Validation failed.' })
  update(@Param('id') id: string, @Body() updateDto: UpdateUniversityDto) {
    return this.universitiesService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a university record' })
  @ApiParam({
    name: 'id',
    description: 'MongoDB identifier of the university.',
  })
  @ApiOkResponse({
    type: University,
    description: 'University removed successfully.',
  })
  @ApiNotFoundResponse({ description: 'University not found.' })
  remove(@Param('id') id: string) {
    return this.universitiesService.remove(id);
  }
}
