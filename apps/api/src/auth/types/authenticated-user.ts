import type { Role } from '../../../generated/prisma/enums';

export interface AuthenticatedUser {
  id: string;
  role: Role;
  phone: string;
  name: string;
}
