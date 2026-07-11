import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest } from '../types/authenticated-request';

export const SchoolId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string | null => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.schoolId ?? request.user?.schoolId ?? null;
  },
);
