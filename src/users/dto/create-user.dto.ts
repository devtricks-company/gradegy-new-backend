import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../schemas/user.schema';

export class CreateUserDto {
  @ApiProperty({ type: Boolean, description: 'Indicates if the user has provided a first name.' })
  first_name!: boolean;

  @ApiProperty({ type: Boolean, description: 'Indicates if the user has provided a last name.' })
  last_name!: boolean;

  @ApiProperty({ type: Boolean, description: 'Flag representing email availability for the user.' })
  email!: boolean;

  @ApiProperty({ type: String, description: 'Hashed password for the user account.' })
  password!: string;

  @ApiProperty({ enum: UserRole, enumName: 'UserRole', description: 'Role assigned to the user within the system.' })
  role!: UserRole;

  @ApiProperty({ type: Boolean, description: 'Determines whether the user account is active.' })
  isActive!: boolean;
}
