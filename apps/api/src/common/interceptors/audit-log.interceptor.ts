import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditLogService } from '../../modules/audit-log/audit-log.service';
import { AuthenticatedRequest } from '../types/authenticated-request';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const SENSITIVE_AUTH_PATHS = ['/auth/login', '/auth/refresh'];

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly auditLogService: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const method = request.method.toUpperCase();

    if (!MUTATING_METHODS.has(method) || this.shouldSkip(request.originalUrl)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap((result) => {
        void this.auditLogService
          .log({
            action: method,
            entity: this.getEntity(request.originalUrl),
            entityId: this.getEntityId(request.params?.['id']),
            before: null,
            after: this.sanitizeResult(result),
            user: request.user,
            schoolId: request.schoolId ?? request.user?.schoolId ?? null,
            ip: request.ip,
            userAgent: request.headers['user-agent'],
          })
          .catch(() => undefined);
      }),
    );
  }

  private shouldSkip(url: string): boolean {
    return SENSITIVE_AUTH_PATHS.some((path) => url.includes(path));
  }

  private getEntity(url: string): string {
    const parts = url.split('?')[0]?.split('/').filter(Boolean) ?? [];
    const apiIndex = parts.findIndex((part) => part === 'api');

    if (apiIndex >= 0 && parts.length > apiIndex + 2) {
      return parts[apiIndex + 2] ?? 'unknown';
    }

    return parts.at(-1) ?? 'unknown';
  }

  private getEntityId(value: unknown): string | undefined {
    if (typeof value === 'string') {
      return value;
    }

    if (Array.isArray(value) && typeof value[0] === 'string') {
      return value[0];
    }

    return undefined;
  }

  private sanitizeResult(result: unknown): unknown {
    if (!result || typeof result !== 'object') {
      return result;
    }

    const json = JSON.parse(JSON.stringify(result)) as Record<string, unknown>;
    delete json['accessToken'];
    delete json['refreshToken'];
    delete json['password'];
    delete json['passwordHash'];
    return json;
  }
}
