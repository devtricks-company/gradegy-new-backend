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
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CreateSchoolDistrictDto } from './dto/create-school-district.dto';
import { UpdateSchoolDistrictDto } from './dto/update-school-district.dto';
import { SchoolDistrict } from './schemas/school-district.schema';
import { SchoolDistrictsService } from './school-districts.service';

@ApiTags('school-districts')
@Controller('school-districts')
export class SchoolDistrictsController {
  constructor(
    private readonly schoolDistrictsService: SchoolDistrictsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new school district' })
  @ApiCreatedResponse({
    type: SchoolDistrict,
    description: 'School district successfully created.',
  })
  create(@Body() createSchoolDistrictDto: CreateSchoolDistrictDto) {
    return this.schoolDistrictsService.create(createSchoolDistrictDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all school districts' })
  @ApiOkResponse({
    type: [SchoolDistrict],
    description: 'School districts retrieved successfully.',
  })
  findAll(@Query() query: Record<string, unknown>) {
    return this.schoolDistrictsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a school district by id' })
  @ApiParam({
    name: 'id',
    description: 'MongoDB identifier of the school district.',
  })
  @ApiOkResponse({
    type: SchoolDistrict,
    description: 'School district retrieved successfully.',
  })
  @ApiNotFoundResponse({ description: 'School district not found.' })
  findOne(@Param('id') id: string) {
    return this.schoolDistrictsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing school district' })
  @ApiParam({
    name: 'id',
    description: 'MongoDB identifier of the school district.',
  })
  @ApiOkResponse({
    type: SchoolDistrict,
    description: 'School district updated successfully.',
  })
  @ApiNotFoundResponse({ description: 'School district not found.' })
  update(
    @Param('id') id: string,
    @Body() updateSchoolDistrictDto: UpdateSchoolDistrictDto,
  ) {
    return this.schoolDistrictsService.update(id, updateSchoolDistrictDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a school district by id' })
  @ApiParam({
    name: 'id',
    description: 'MongoDB identifier of the school district.',
  })
  @ApiOkResponse({
    type: SchoolDistrict,
    description: 'School district removed successfully.',
  })
  @ApiNotFoundResponse({ description: 'School district not found.' })
  remove(@Param('id') id: string) {
    return this.schoolDistrictsService.remove(id);
  }
}
