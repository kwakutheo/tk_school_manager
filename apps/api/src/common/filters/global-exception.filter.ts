import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { AuthenticatedRequest } from '../types/authenticated-request';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<AuthenticatedRequest>();
    const isProduction = process.env.NODE_ENV === 'production';

    const status = this.getStatus(exception);
    const message = this.getMessage(exception, status);

    response.status(status).json({
      statusCode: status,
      message,
      path: request.originalUrl,
      timestamp: new Date().toISOString(),
      ...(isProduction ? {} : { error: this.getErrorName(exception) }),
    });
  }

  private getStatus(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        return HttpStatus.CONFLICT;
      }

      if (exception.code === 'P2025') {
        return HttpStatus.NOT_FOUND;
      }
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private getMessage(exception: unknown, status: number): string | string[] {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();

      if (typeof response === 'object' && response !== null && 'message' in response) {
        const message = (response as { message: string | string[] }).message;
        return message;
      }

      return exception.message;
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        return 'A record with this unique value already exists';
      }

      if (exception.code === 'P2025') {
        return 'Resource not found';
      }
    }

    return status === HttpStatus.INTERNAL_SERVER_ERROR ? 'Internal server error' : 'Request failed';
  }

  private getErrorName(exception: unknown): string {
    return exception instanceof Error ? exception.name : 'UnknownError';
  }
}
