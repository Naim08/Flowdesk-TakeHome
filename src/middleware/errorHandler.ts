// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import logger  from '../utils/logger';
import { ApiError } from '../utils/errors';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof ApiError) {
    logger.warn(`API Error: ${err.statusCode} - ${err.message}`);
    return res.status(err.statusCode).json({
      error: {
        code: err.statusCode,
        message: err.message,
        details: err.details
      }
    });
  }

  logger.error(`Unhandled Error: ${err.message}`, { stack: err.stack });
  res.status(500).json({
    error: {
      code: 500,
      message: 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }
  });
};