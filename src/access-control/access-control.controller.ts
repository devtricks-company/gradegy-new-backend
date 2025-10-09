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
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreateSubcategoryDto } from '../subcategories/dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from '../subcategories/dto/update-subcategory.dto';
import { Category } from '../categories/schemas/category.schema';
import { Project } from '../projects/schemas/project.schema';
import { Subcategory } from '../subcategories/schemas/subcategory.schema';
import { SubcategoriesService } from '../subcategories/subcategories.service';
import { UserRole } from '../users/schemas/user.schema';
import { CreateUserAssignmentDto } from './dto/create-user-assignment.dto';
import { UserAssignment } from './schemas/user-assignment.schema';
import { AccessControlService } from './access-control.service';

@ApiTags('access-control')
@Controller('access')
export class AccessControlController {
  constructor(
    private readonly accessControlService: AccessControlService,
    private readonly subcategoriesService: SubcategoriesService,
  ) {}

  @Post('assignments')
  @Roles(UserRole.Ultra, UserRole.Super, UserRole.Admin)
  @ApiOperation({ summary: 'Assign scoped access to a user.' })
  @ApiCreatedResponse({ type: UserAssignment })
  async createAssignment(@Body() createDto: CreateUserAssignmentDto) {
    return this.accessControlService.createAssignment(createDto);
  }

  @Get('assignments/:userId')
  @Roles(UserRole.Ultra, UserRole.Super, UserRole.Admin)
  @ApiOperation({ summary: 'List assignments for a specific user.' })
  @ApiParam({
    name: 'userId',
    description: 'User identifier.',
    type: String,
  })
  @ApiOkResponse({ type: UserAssignment, isArray: true })
  async listAssignments(@Param('userId') userId: string) {
    return this.accessControlService.listAssignmentsForUser(userId);
  }

  @Get('projects')
  @ApiOperation({ summary: 'List projects the current user can access.' })
  @ApiOkResponse({ type: Project, isArray: true })
  async listProjects(@CurrentUser() user: AuthenticatedUser) {
    return this.accessControlService.listProjectsForUser(user.id);
  }

  @Get('categories')
  @ApiOperation({ summary: 'List categories accessible to the current user.' })
  @ApiOkResponse({ type: Category, isArray: true })
  @ApiQuery({
    name: 'projectId',
    required: false,
    description: 'Optional project id to further scope the results.',
    type: String,
  })
  async listCategories(
    @CurrentUser() user: AuthenticatedUser,
    @Query('projectId') projectId?: string,
  ) {
    return this.accessControlService.listCategoriesForUser(user.id, projectId);
  }

  @Get('subcategories')
  @ApiOperation({
    summary: 'List subcategories accessible to the current user.',
  })
  @ApiOkResponse({ type: Subcategory, isArray: true })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    description: 'Optional category id to filter the results.',
    type: String,
  })
  async listSubcategories(
    @CurrentUser() user: AuthenticatedUser,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.accessControlService.listSubcategoriesForUser(
      user.id,
      categoryId,
    );
  }

  @Get('subcategories/:id')
  @ApiOperation({
    summary: 'Get a subcategory if it is within the user scope.',
  })
  @ApiParam({
    name: 'id',
    description: 'Subcategory identifier.',
    type: String,
  })
  @ApiOkResponse({ type: Subcategory })
  async getSubcategory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    await this.accessControlService.ensureSubcategoryReadAccess(user.id, id);
    return this.subcategoriesService.findOne(id);
  }

  @Post('subcategories')
  @ApiOperation({ summary: 'Create a subcategory within the permitted scope.' })
  @ApiCreatedResponse({ type: Subcategory })
  async createSubcategory(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createDto: CreateSubcategoryDto,
  ) {
    await this.accessControlService.ensureCategoryWriteAccess(
      user.id,
      createDto.category,
    );

    const subcategory = await this.subcategoriesService.create(createDto);
    this.accessControlService.invalidateScopeForUser(user.id);
    return subcategory;
  }

  @Patch('subcategories/:id')
  @ApiOperation({ summary: 'Update a subcategory within the permitted scope.' })
  @ApiParam({
    name: 'id',
    description: 'Subcategory identifier.',
    type: String,
  })
  @ApiOkResponse({ type: Subcategory })
  async updateSubcategory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updateDto: UpdateSubcategoryDto,
  ) {
    await this.accessControlService.ensureSubcategoryWriteAccess(user.id, id);

    if (updateDto.category) {
      await this.accessControlService.ensureCategoryWriteAccess(
        user.id,
        updateDto.category,
      );
    }

    const subcategory = await this.subcategoriesService.update(id, updateDto);
    this.accessControlService.invalidateScopeForUser(user.id);
    return subcategory;
  }

  @Delete('subcategories/:id')
  @ApiOperation({ summary: 'Delete a subcategory within the permitted scope.' })
  @ApiParam({
    name: 'id',
    description: 'Subcategory identifier.',
    type: String,
  })
  @ApiOkResponse({ type: Subcategory })
  async deleteSubcategory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    await this.accessControlService.ensureSubcategoryWriteAccess(user.id, id);
    const subcategory = await this.subcategoriesService.remove(id);
    this.accessControlService.invalidateScopeForUser(user.id);
    return subcategory;
  }
}
