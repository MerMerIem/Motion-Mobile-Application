import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { STATUS_CODES } from 'node:http';
import { ErrorResponseDto } from '../dto/error-response.dto.js';

export const ApiError = (status: number, message: string) =>
  ApiResponse({
    status,
    description: message,
    type: ErrorResponseDto,
    example: {
      statusCode: status,
      error: STATUS_CODES[status],
      message,
    },
  });

/** 400: the request body failed Zod validation */
export const ApiValidationError = () =>
  ApiResponse({
    status: 400,
    description: 'Validation failed',
    type: ErrorResponseDto,
    example: {
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation failed',
      details: [{ field: 'email', message: 'Invalid email address' }],
    },
  });

/** Protected route: lock icon + 401 */
export const ApiProtected = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiError(401, 'Missing, invalid or expired access token'),
  );
