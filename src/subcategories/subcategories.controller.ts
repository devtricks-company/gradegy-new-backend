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
import { ExecuteQueryResult } from '../common/utils/mongoose-query.util';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';
import {
  Subcategory,
  SubcategoryDocument,
} from './schemas/subcategory.schema';
import { SubcategoriesService } from './subcategories.service';

@ApiTags('subcategories')
@ApiExtraModels(Subcategory)
@Controller('subcategories')
export class SubcategoriesController {
  constructor(private readonly subcategoriesService: SubcategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new subcategory' })
  @ApiCreatedResponse({
    type: Subcategory,
    description: 'Subcategory created successfully.',
  })
  create(@Body() createSubcategoryDto: CreateSubcategoryDto) {
    return this.subcategoriesService.create(createSubcategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve a paginated list of subcategories' })
  @ApiOkResponse({
    description: 'Subcategories retrieved successfully.',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(Subcategory) },
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
    description: 'Full-text search applied to title. Alias: q.',
    example: 'Robotics',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    type: String,
    description:
      'Comma separated sort definition. Prefix with - for descending. Allowed fields: title, createdAt, updatedAt.',
    example: 'title,-createdAt',
  })
  @ApiQuery({
    name: 'filters',
    required: false,
    style: 'deepObject',
    explode: true,
    description:
      'Filter definitions using deep object syntax, e.g. filters[is_active]=true & filters[createdAt][gte]=2024-01-01. Supported fields: title, category, localize_reward, coins, store, is_active, createdAt, updatedAt. Operators vary per field: eq, in, gte, lte.',
    schema: {
      type: 'object',
      additionalProperties: true,
    },
    example: {
      is_active: true,
      createdAt: { gte: '2024-01-01' },
    },
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    type: String,
    description:
      'JSON encoded filter definition. Same shape as filters but passed as a JSON string.',
    example: '{"is_active":true}',
  })
  findAll(
    @Query() query: Record<string, unknown>,
  ): Promise<ExecuteQueryResult<SubcategoryDocument>> {
    return this.subcategoriesService.findAll(query);
  }

  @Get('category/:categoryId')
  @ApiOperation({
    summary: 'Retrieve a paginated list of subcategories for a category',
  })
  @ApiParam({
    name: 'categoryId',
    description: 'MongoDB identifier of the parent category.',
  })
  @ApiOkResponse({
    description: 'Subcategories retrieved successfully.',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(Subcategory) },
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
    description: 'Full-text search applied to title. Alias: q.',
    example: 'Robotics',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    type: String,
    description:
      'Comma separated sort definition. Prefix with - for descending. Allowed fields: title, createdAt, updatedAt.',
    example: 'title,-createdAt',
  })
  @ApiQuery({
    name: 'filters',
    required: false,
    style: 'deepObject',
    explode: true,
    description:
      'Filter definitions using deep object syntax, e.g. filters[is_active]=true & filters[createdAt][gte]=2024-01-01. Supported fields: title, category, localize_reward, coins, store, is_active, createdAt, updatedAt. Operators vary per field: eq, in, gte, lte.',
    schema: {
      type: 'object',
      additionalProperties: true,
    },
    example: {
      is_active: true,
      createdAt: { gte: '2024-01-01' },
    },
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    type: String,
    description:
      'JSON encoded filter definition. Same shape as filters but passed as a JSON string.',
    example: '{"is_active":true}',
  })
  findAllByCategory(
    @Param('categoryId') categoryId: string,
    @Query() query: Record<string, unknown>,
  ): Promise<ExecuteQueryResult<SubcategoryDocument>> {
    return this.subcategoriesService.findAllByCategory(categoryId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a subcategory by id' })
  @ApiParam({
    name: 'id',
    description: 'MongoDB identifier of the subcategory.',
  })
  @ApiOkResponse({
    type: Subcategory,
    description: 'Subcategory retrieved successfully.',
  })
  @ApiNotFoundResponse({ description: 'Subcategory not found.' })
  findOne(@Param('id') id: string) {
    return this.subcategoriesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing subcategory' })
  @ApiParam({
    name: 'id',
    description: 'MongoDB identifier of the subcategory.',
  })
  @ApiOkResponse({
    type: Subcategory,
    description: 'Subcategory updated successfully.',
  })
  @ApiNotFoundResponse({ description: 'Subcategory not found.' })
  update(
    @Param('id') id: string,
    @Body() updateSubcategoryDto: UpdateSubcategoryDto,
  ) {
    return this.subcategoriesService.update(id, updateSubcategoryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a subcategory by id' })
  @ApiParam({
    name: 'id',
    description: 'MongoDB identifier of the subcategory.',
  })
  @ApiOkResponse({
    type: Subcategory,
    description: 'Subcategory removed successfully.',
  })
  @ApiNotFoundResponse({ description: 'Subcategory not found.' })
  remove(@Param('id') id: string) {
    return this.subcategoriesService.remove(id);
  }
}
