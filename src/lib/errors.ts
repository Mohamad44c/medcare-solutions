/**
 * Error handling utilities for consistent error responses
 */

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(error: Error | AppError) {
  const isAppError = error instanceof AppError;

  return {
    success: false,
    message: error.message,
    statusCode: isAppError ? error.statusCode : 500,
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      name: error.name,
    }),
  };
}

/**
 * Handle async errors in API routes
 */
export function withErrorHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error('Unhandled error:', error);
      throw error;
    }
  };
}

/**
 * Validate required fields
 */
export function validateRequired(data: any, fields: string[]): void {
  const missing = fields.filter(field => !data[field]);

  if (missing.length > 0) {
    throw new ValidationError(`Missing required fields: ${missing.join(', ')}`);
  }
}

/**
 * Validate ID format
 */
export function validateId(id: string): void {
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    throw new ValidationError('Invalid ID provided');
  }
}
