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
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';
import { Subcategory } from './schemas/subcategory.schema';
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
  findAll(@Query() query: Record<string, unknown>) {
    return this.subcategoriesService.findAll(query);
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
