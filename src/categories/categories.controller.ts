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
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
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
