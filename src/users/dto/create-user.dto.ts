import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
} from 'class-validator';
import { UserRole } from '../schemas/user.schema';

export class CreateUserDto {
  @ApiPropertyOptional({ description: 'User given name.', example: 'Dana' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ description: 'User family name.', example: 'Azarbashi' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ description: 'User email address.', example: 'user@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Plain text password (min 8 chars).', minLength: 8 })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiPropertyOptional({ description: 'Avatar image URL.', example: 'https://example.com/avatar.png' })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  avatarUrl?: string;

  @ApiPropertyOptional({ enum: UserRole, enumName: 'UserRole', description: 'Role assigned to the user.' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ description: 'Whether the user account is active.', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
