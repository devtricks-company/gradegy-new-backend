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
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './schemas/category.schema';
import { CategoriesService } from './categories.service';

@ApiTags('categories')
@ApiExtraModels(Category)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new category' })
  @ApiCreatedResponse({
    type: Category,
    description: 'Category created successfully.',
  })
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve a paginated list of categories' })
  @ApiOkResponse({
    description: 'Categories retrieved successfully.',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(Category) },
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
    return this.categoriesService.findAll(query);
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Retrieve categories associated with a project' })
  @ApiParam({
    name: 'projectId',
    description: 'MongoDB identifier of the project.',
  })
  @ApiOkResponse({
    description: 'Categories retrieved successfully.',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(Category) },
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
    description:
      'Number of records to skip before fetching results. Alias: skip.',
    example: 0,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description:
      'Free-text search applied to category title and school_level. Alias: q.',
    example: 'STEM',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    type: String,
    description:
      'Comma separated sort definition. Prefix with - for descending. Allowed fields: title, school_level, createdAt, updatedAt. Alias: orderBy.',
    example: 'title,-createdAt',
  })
  @ApiQuery({
    name: 'filters',
    required: false,
    style: 'deepObject',
    explode: true,
    description:
      'Filter definitions using deep object syntax, e.g. filters[school_level]=high_school & filters[createdAt][gte]=2024-01-01. Supported fields: title, school_level, localize_award, coins, store, display_project, is_active, project, highschool, createdAt, updatedAt. Operators vary per field and include eq, in, gte, lte.',
    schema: {
      type: 'object',
      additionalProperties: true,
    },
    example: {
      school_level: 'high_school',
      is_active: true,
    },
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    type: String,
    description:
      'JSON encoded filter definition. Same shape as filters but passed as a JSON string.',
    example: '{"school_level":["middle_school","high_school"]}',
  })
  findByProject(
    @Param('projectId') projectId: string,
    @Query() query: Record<string, unknown>,
  ) {
    return this.categoriesService.findByProjectId(projectId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a category by id' })
  @ApiParam({
    name: 'id',
    description: 'MongoDB identifier of the category.',
  })
  @ApiOkResponse({
    type: Category,
    description: 'Category retrieved successfully.',
  })
  @ApiNotFoundResponse({ description: 'Category not found.' })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing category' })
  @ApiParam({
    name: 'id',
    description: 'MongoDB identifier of the category.',
  })
  @ApiOkResponse({
    type: Category,
    description: 'Category updated successfully.',
  })
  @ApiNotFoundResponse({ description: 'Category not found.' })
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a category by id' })
  @ApiParam({
    name: 'id',
    description: 'MongoDB identifier of the category.',
  })
  @ApiOkResponse({
    type: Category,
    description: 'Category removed successfully.',
  })
  @ApiNotFoundResponse({ description: 'Category not found.' })
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
