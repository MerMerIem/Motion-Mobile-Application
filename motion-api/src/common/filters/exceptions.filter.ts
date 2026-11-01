import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { ZodValidationException } from 'nestjs-zod';
import type { ZodError } from 'zod';
import { STATUS_CODES } from 'node:http';

@Catch()
export class ExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    // 1. Zod validation errors: flatten into { field, message }
    if (exception instanceof ZodValidationException) {
      const zodError = exception.getZodError() as ZodError;
      return res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: 400,
        error: STATUS_CODES[400],
        message: 'Validation failed',
        details: zodError.issues.map((i) => ({
          field: i.path.map(String).join('.'),
          message: i.message,
        })),
      });
    }

    // 2. Normal Nest errors (401, 404, 409...)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const message =
        typeof body === 'string'
          ? body
          : ((body as { message?: string | string[] }).message ??
            exception.message);

      return res.status(status).json({
        statusCode: status,
        error: STATUS_CODES[status] ?? 'Error',
        message: Array.isArray(message) ? message.join(', ') : message,
      });
    }

    // 3. Anything else is a bug: log it, but never leak details
    this.logger.error(exception);
    return res.status(500).json({
      statusCode: 500,
      error: STATUS_CODES[500],
      message: 'Something went wrong',
    });
  }
}
