import { Controller, Get } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { ExperienceTypesService } from './experience-types.service';
import { ExperienceType } from './schemas/experience-type.schema';

@ApiTags('experience-types')
@ApiExtraModels(ExperienceType)
@Controller('experience-types')
export class ExperienceTypesController {
  constructor(
    private readonly experienceTypesService: ExperienceTypesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Retrieve all experience types' })
  @ApiOkResponse({
    description: 'Experience types retrieved successfully.',
    schema: {
      type: 'array',
      items: { $ref: getSchemaPath(ExperienceType) },
    },
  })
  findAll() {
    return this.experienceTypesService.findAll();
  }
}
