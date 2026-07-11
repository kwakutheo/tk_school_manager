import { Request } from 'express';
import { IAuthenticatedUser } from '@school-saas/types';

export interface AuthenticatedRequest extends Request {
  user?: IAuthenticatedUser;
  schoolId?: string | null;
}
