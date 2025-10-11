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
import { CreateHighschoolDto } from './dto/create-highschool.dto';
import { UpdateHighschoolDto } from './dto/update-highschool.dto';
import { Highschool } from './schemas/highschool.schema';
import { HighschoolsService } from './highschools.service';

@ApiTags('highschools')
@ApiExtraModels(Highschool)
@Controller('highschools')
export class HighschoolsController {
  constructor(private readonly highschoolsService: HighschoolsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new high school' })
  @ApiCreatedResponse({
    type: Highschool,
    description: 'High school created successfully.',
  })
  create(@Body() createHighschoolDto: CreateHighschoolDto) {
    return this.highschoolsService.create(createHighschoolDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve a paginated list of high schools' })
  @ApiOkResponse({
    description: 'High schools retrieved successfully.',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(Highschool) },
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
    return this.highschoolsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a high school by id' })
  @ApiParam({
    name: 'id',
    description: 'MongoDB identifier of the high school.',
  })
  @ApiOkResponse({
    type: Highschool,
    description: 'High school retrieved successfully.',
  })
  @ApiNotFoundResponse({ description: 'High school not found.' })
  findOne(@Param('id') id: string) {
    return this.highschoolsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing high school' })
  @ApiParam({
    name: 'id',
    description: 'MongoDB identifier of the high school.',
  })
  @ApiOkResponse({
    type: Highschool,
    description: 'High school updated successfully.',
  })
  @ApiNotFoundResponse({ description: 'High school not found.' })
  update(
    @Param('id') id: string,
    @Body() updateHighschoolDto: UpdateHighschoolDto,
  ) {
    return this.highschoolsService.update(id, updateHighschoolDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a high school by id' })
  @ApiParam({
    name: 'id',
    description: 'MongoDB identifier of the high school.',
  })
  @ApiOkResponse({
    type: Highschool,
    description: 'High school removed successfully.',
  })
  @ApiNotFoundResponse({ description: 'High school not found.' })
  remove(@Param('id') id: string) {
    return this.highschoolsService.remove(id);
  }
}
