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
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { CreateUniversityDto } from './dto/create-university.dto';
import { UpdateUniversityDto } from './dto/update-university.dto';
import { UniversitiesService } from './universities.service';
import { University } from './schemas/university.schema';

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
  findAll(@Query() query: Record<string, unknown>) {
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
