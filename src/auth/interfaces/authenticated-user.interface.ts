import { UserRole } from '../../users/schemas/user.schema';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  role: UserRole;
  isActive: boolean;
}
