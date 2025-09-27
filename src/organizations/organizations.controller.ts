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
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationsService } from './organizations.service';
import { Organization } from './schemas/organization.schema';

@ApiTags('organizations')
@ApiExtraModels(Organization)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new organization' })
  @ApiCreatedResponse({
    type: Organization,
    description: 'Organization created successfully.',
  })
  @ApiBadRequestResponse({ description: 'Validation failed.' })
  create(@Body() createOrganizationDto: CreateOrganizationDto) {
    return this.organizationsService.create(createOrganizationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve a paginated list of organizations' })
  @ApiOkResponse({
    description: 'Organizations retrieved successfully.',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(Organization) },
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
    return this.organizationsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve an organization by id' })
  @ApiParam({
    name: 'id',
    description: 'MongoDB identifier of the organization.',
  })
  @ApiOkResponse({
    type: Organization,
    description: 'Organization retrieved successfully.',
  })
  @ApiNotFoundResponse({ description: 'Organization not found.' })
  findOne(@Param('id') id: string) {
    return this.organizationsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing organization' })
  @ApiParam({
    name: 'id',
    description: 'MongoDB identifier of the organization.',
  })
  @ApiOkResponse({
    type: Organization,
    description: 'Organization updated successfully.',
  })
  @ApiNotFoundResponse({ description: 'Organization not found.' })
  @ApiBadRequestResponse({ description: 'Validation failed.' })
  update(
    @Param('id') id: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(id, updateOrganizationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove an organization by id' })
  @ApiParam({
    name: 'id',
    description: 'MongoDB identifier of the organization.',
  })
  @ApiOkResponse({
    type: Organization,
    description: 'Organization removed successfully.',
  })
  @ApiNotFoundResponse({ description: 'Organization not found.' })
  remove(@Param('id') id: string) {
    return this.organizationsService.remove(id);
  }
}
