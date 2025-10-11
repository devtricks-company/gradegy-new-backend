import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
import { CreateExperienceImageDto } from './dto/create-experience-image.dto';
import { UpdateExperienceImageDto } from './dto/update-experience-image.dto';
import { ExperienceImagesService } from './experience-images.service';
import { ExperienceImage } from './schemas/experience-image.schema';

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
      type: 'array',
      items: { $ref: getSchemaPath(ExperienceImage) },
    },
  })
  findAll() {
    return this.experienceImagesService.findAll();
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
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateExperienceImageDto,
  ) {
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
