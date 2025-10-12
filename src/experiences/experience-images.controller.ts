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
import { CreateExperienceImageDto } from './dto/create-experience-image.dto';
import { UpdateExperienceImageDto } from './dto/update-experience-image.dto';
import { ExperienceImagesService } from './experience-images.service';
import {
  ExperienceImage,
  ExperienceImageDocument,
} from './schemas/experience-image.schema';
import { ExecuteQueryResult } from '../common/utils/mongoose-query.util';

@ApiTags('experience-images')
@ApiExtraModels(ExperienceImage)
@Controller('experience-images')
export class ExperienceImagesController {
  constructor(
    private readonly experienceImagesService: ExperienceImagesService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new experience image' })
  @ApiCreatedResponse({
    type: ExperienceImage,
    description: 'Experience image created successfully.',
  })
  create(@Body() createDto: CreateExperienceImageDto) {
    return this.experienceImagesService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all experience images' })
  @ApiOkResponse({
    description: 'Experience images retrieved successfully.',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(ExperienceImage) },
        },
        meta: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 25 },
            totalItems: { type: 'integer', example: 50 },
            totalPages: { type: 'integer', example: 2 },
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
    description: 'Full-text search applied to url, title, and tags. Alias: q.',
    example: 'banner',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    type: String,
    description:
      'Comma separated sort definition. Prefix with - for descending. Allowed fields: url, title, default, experienceType, createdAt, updatedAt. Alias: orderBy.',
    example: 'title,-createdAt',
  })
  @ApiQuery({
    name: 'filters',
    required: false,
    style: 'deepObject',
    explode: true,
    description:
      'Filter definitions using deep object syntax, e.g. filters[experienceType]=6512bd... & filters[createdAt][gte]=2024-01-01. Supported fields: url, title, tags, default, experienceType, createdAt, updatedAt.',
    schema: {
      type: 'object',
      additionalProperties: true,
    },
    example: {
      experienceType: '6512bd43d9caa6e02c990b0d',
      default: true,
    },
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    type: String,
    description:
      'JSON encoded filter definition. Same shape as filters but passed as a JSON string.',
    example: '{"default":true}',
  })
  findAll(
    @Query() query: Record<string, unknown>,
  ): Promise<ExecuteQueryResult<ExperienceImageDocument>> {
    return this.experienceImagesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve an experience image by id' })
  @ApiParam({
    name: 'id',
    description: 'MongoDB identifier of the experience image.',
  })
  @ApiOkResponse({
    type: ExperienceImage,
    description: 'Experience image retrieved successfully.',
  })
  @ApiNotFoundResponse({ description: 'Experience image not found.' })
  findOne(@Param('id') id: string) {
    return this.experienceImagesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing experience image' })
  @ApiParam({
    name: 'id',
    description: 'MongoDB identifier of the experience image.',
  })
  @ApiOkResponse({
    type: ExperienceImage,
    description: 'Experience image updated successfully.',
  })
  @ApiNotFoundResponse({ description: 'Experience image not found.' })
  update(@Param('id') id: string, @Body() updateDto: UpdateExperienceImageDto) {
    return this.experienceImagesService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove an experience image by id' })
  @ApiParam({
    name: 'id',
    description: 'MongoDB identifier of the experience image.',
  })
  @ApiOkResponse({
    type: ExperienceImage,
    description: 'Experience image removed successfully.',
  })
  @ApiNotFoundResponse({ description: 'Experience image not found.' })
  remove(@Param('id') id: string) {
    return this.experienceImagesService.remove(id);
  }
}
