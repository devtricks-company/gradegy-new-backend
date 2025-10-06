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
  ApiQuery,
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
    description: 'Number of records to skip before fetching results. Alias: skip.',
    example: 0,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Full-text search applied to agancy_id, agancy_name, state_name, state_agancy_id. Alias: q.',
    example: 'district 42',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    type: String,
    description: 'Comma separated sort definition. Prefix with - for descending. Allowed fields: agancy_name, agancy_id, state_name, state_agancy_id, createdAt, updatedAt.',
    example: 'agancy_name,-createdAt',
  })
  @ApiQuery({
    name: 'filters',
    required: false,
    style: 'deepObject',
    explode: true,
    description: 'Filter definitions using deep object syntax, e.g. filters[state_name]=California & filters[createdAt][gte]=2024-01-01. Supported fields: agancy_id, agancy_name, state_name, state_agancy_id, isActive, createdAt, updatedAt. Operators vary per field: eq, in, gte, lte.',
    schema: {
      type: 'object',
      additionalProperties: true,
    },
    example: {
      state_name: 'California',
      createdAt: { 'gte': '2024-01-01' },
    },
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    type: String,
    description: 'JSON encoded filter definition. Same shape as filters but passed as a JSON string.',
    example: '{"state_name":"California"}',
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
