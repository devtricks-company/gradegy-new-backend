import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
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
import { ApproveExperienceProgressDto } from './dto/approve-experience-progress.dto';
import { MarkExperienceViewedDto } from './dto/mark-experience-viewed.dto';
import { RejectExperienceProgressDto } from './dto/reject-experience-progress.dto';
import { SubmitExperienceEvidenceDto } from './dto/submit-experience-evidence.dto';
import { ExperienceProgressService } from './experience-progress.service';
import { ExperienceProgress } from './schemas/experience-progress.schema';

@ApiTags('experience-progress')
@ApiExtraModels(ExperienceProgress)
@Controller('experience-progress')
export class ExperienceProgressController {
  constructor(
    private readonly experienceProgressService: ExperienceProgressService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Retrieve a paginated list of progress records.' })
  @ApiOkResponse({
    description: 'Progress records retrieved successfully.',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(ExperienceProgress) },
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
    return this.experienceProgressService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a single progress record.' })
  @ApiParam({
    name: 'id',
    description: 'MongoDB identifier of the progress document.',
  })
  @ApiOkResponse({
    type: ExperienceProgress,
    description: 'Progress record retrieved successfully.',
  })
  @ApiNotFoundResponse({ description: 'Progress record not found.' })
  findOne(@Param('id') id: string) {
    return this.experienceProgressService.findOne(id);
  }

  @Get('experiences/:experienceId')
  @ApiOperation({ summary: 'List progress records for a specific experience.' })
  @ApiParam({
    name: 'experienceId',
    description: 'MongoDB identifier of the experience.',
  })
  @ApiOkResponse({
    description: 'Progress records retrieved successfully.',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(ExperienceProgress) },
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
  findByExperience(
    @Param('experienceId') experienceId: string,
    @Query() query: Record<string, unknown>,
  ) {
    return this.experienceProgressService.findByExperience(experienceId, query);
  }

  @Get('users/:userId')
  @ApiOperation({ summary: 'List progress records for a specific user.' })
  @ApiParam({
    name: 'userId',
    description: 'MongoDB identifier of the user.',
  })
  @ApiOkResponse({
    description: 'Progress records retrieved successfully.',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(ExperienceProgress) },
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
  findByUser(
    @Param('userId') userId: string,
    @Query() query: Record<string, unknown>,
  ) {
    return this.experienceProgressService.findByUser(userId, query);
  }

  @Post('experiences/:experienceId/view')
  @ApiOperation({ summary: 'Mark an experience as viewed by a learner.' })
  @ApiParam({
    name: 'experienceId',
    description: 'MongoDB identifier of the experience.',
  })
  @ApiCreatedResponse({
    type: ExperienceProgress,
    description: 'Progress record updated successfully.',
  })
  markViewed(
    @Param('experienceId') experienceId: string,
    @Body() dto: MarkExperienceViewedDto,
  ) {
    return this.experienceProgressService.markViewed(experienceId, dto);
  }

  @Post('experiences/:experienceId/submit')
  @ApiOperation({ summary: 'Submit completion evidence for an experience.' })
  @ApiParam({
    name: 'experienceId',
    description: 'MongoDB identifier of the experience.',
  })
  @ApiCreatedResponse({
    type: ExperienceProgress,
    description: 'Evidence submitted successfully.',
  })
  submitEvidence(
    @Param('experienceId') experienceId: string,
    @Body() dto: SubmitExperienceEvidenceDto,
  ) {
    return this.experienceProgressService.submitEvidence(experienceId, dto);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve an experience progress submission.' })
  @ApiParam({
    name: 'id',
    description: 'MongoDB identifier of the progress document.',
  })
  @ApiOkResponse({
    type: ExperienceProgress,
    description: 'Submission approved successfully.',
  })
  approve(@Param('id') id: string, @Body() dto: ApproveExperienceProgressDto) {
    return this.experienceProgressService.approve(id, dto);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject an experience progress submission.' })
  @ApiParam({
    name: 'id',
    description: 'MongoDB identifier of the progress document.',
  })
  @ApiOkResponse({
    type: ExperienceProgress,
    description: 'Submission rejected successfully.',
  })
  reject(@Param('id') id: string, @Body() dto: RejectExperienceProgressDto) {
    return this.experienceProgressService.reject(id, dto);
  }
}
