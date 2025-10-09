import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
  IsUrl,
} from 'class-validator';
import { UserRole } from '../../users/schemas/user.schema';

export const ADMINISTRATIVE_ROLES: UserRole[] = [
  UserRole.Ultra,
  UserRole.Super,
  UserRole.Admin,
];

export class RegisterAdminDto {
  @ApiProperty({ example: 'Dana' })
  @IsString()
  firstName!: string;

  @ApiProperty({ example: 'Azarbashi' })
  @IsString()
  lastName!: string;

  @ApiProperty({ example: 'admin@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({
    enum: ADMINISTRATIVE_ROLES,
    enumName: 'AdministrativeRole',
  })
  @IsIn(ADMINISTRATIVE_ROLES)
  role!: UserRole;

  @ApiPropertyOptional({ example: '+1-555-123-4567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.png' })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  avatarUrl?: string;

  @ApiPropertyOptional({ example: 'Math tutor' })
  @IsOptional()
  @IsString()
  jobs?: string;
}
