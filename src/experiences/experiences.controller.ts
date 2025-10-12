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
import { CreateExperienceDto } from './dto/create-experience.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';
import { Experience } from './schemas/experience.schema';
import { ExperiencesService } from './experiences.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@ApiTags('experiences')
@ApiExtraModels(Experience)
@Controller('experiences')
export class ExperiencesController {
  constructor(private readonly experiencesService: ExperiencesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new experience' })
  @ApiCreatedResponse({
    type: Experience,
    description: 'Experience created successfully.',
  })
  create(@Body() createExperienceDto: CreateExperienceDto) {
    return this.experiencesService.create(createExperienceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve a paginated list of experiences' })
  @ApiOkResponse({
    description: 'Experiences retrieved successfully.',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(Experience) },
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
  findAll(
    @Query() query: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.experiencesService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve an experience by id' })
  @ApiParam({
    name: 'id',
    description: 'MongoDB identifier of the experience.',
  })
  @ApiOkResponse({
    type: Experience,
    description: 'Experience retrieved successfully.',
  })
  @ApiNotFoundResponse({ description: 'Experience not found.' })
  findOne(@Param('id') id: string) {
    return this.experiencesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing experience' })
  @ApiParam({
    name: 'id',
    description: 'MongoDB identifier of the experience.',
  })
  @ApiOkResponse({
    type: Experience,
    description: 'Experience updated successfully.',
  })
  @ApiNotFoundResponse({ description: 'Experience not found.' })
  update(
    @Param('id') id: string,
    @Body() updateExperienceDto: UpdateExperienceDto,
  ) {
    return this.experiencesService.update(id, updateExperienceDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove an experience by id' })
  @ApiParam({
    name: 'id',
    description: 'MongoDB identifier of the experience.',
  })
  @ApiOkResponse({
    type: Experience,
    description: 'Experience removed successfully.',
  })
  @ApiNotFoundResponse({ description: 'Experience not found.' })
  remove(@Param('id') id: string) {
    return this.experiencesService.remove(id);
  }
}
