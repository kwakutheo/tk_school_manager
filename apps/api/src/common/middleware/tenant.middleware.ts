import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { NextFunction, Response } from 'express';
import { IJwtPayload } from '@school-saas/types';
import { AuthenticatedRequest } from '../types/authenticated-request';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly jwtService = new JwtService();

  constructor(private readonly configService: ConfigService) {}

  use(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

    if (!token) {
      next();
      return;
    }

    try {
      const payload = this.jwtService.verify<IJwtPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
      req.schoolId = payload.schoolId ?? null;
    } catch {
      req.schoolId = null;
    }

    next();
  }
}
