import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { env } from '../config/env.js';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        statusCode: err.statusCode,
        details: err.details || null,
      },
    });
  }

  console.error('Unhandled Error:', err);

  return res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
      statusCode: 500,
      ...(env.NODE_ENV === 'development' ? { details: err.message } : {}),
    },
  });
};
