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
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './schemas/user.schema';
import { UsersService } from './users.service';
import { ExecuteQueryResult } from 'src/common/utils/mongoose-query.util';

@ApiTags('users')
@ApiExtraModels(User)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiCreatedResponse({ type: User, description: 'User successfully created.' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all users' })
  @ApiOkResponse({
    type: [User],
    description: 'List of users retrieved successfully.',
  })
  findAll() {
    return this.usersService.findAll();
  }

  @Get('admins')
  @ApiOperation({
    summary: 'Retrieve administrative users with pagination and filters',
  })
  @ApiOkResponse({
    description:
      'Administrative users (ultra, super, admin) retrieved successfully.',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(User) },
        },
        meta: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 25 },
            totalItems: { type: 'integer', example: 42 },
            totalPages: { type: 'integer', example: 2 },
            hasNextPage: { type: 'boolean', example: false },
            hasPreviousPage: { type: 'boolean', example: false },
          },
        },
      },
    },
  })
  findAllAdministrative(@Query() query: Record<string, unknown>):Promise<ExecuteQueryResult<UserDocument>> {
    return this.usersService.findAllAdministrative(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a user by id' })
  @ApiOkResponse({ type: User, description: 'User retrieved successfully.' })
  @ApiNotFoundResponse({ description: 'User not found.' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing user' })
  @ApiOkResponse({ type: User, description: 'User updated successfully.' })
  @ApiNotFoundResponse({ description: 'User not found.' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a user by id' })
  @ApiOkResponse({ type: User, description: 'User removed successfully.' })
  @ApiNotFoundResponse({ description: 'User not found.' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
