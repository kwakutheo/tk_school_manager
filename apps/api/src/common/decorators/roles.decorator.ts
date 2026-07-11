import { SetMetadata } from '@nestjs/common';
import { Role } from '@school-saas/config';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]): ReturnType<typeof SetMetadata> => SetMetadata(ROLES_KEY, roles);
