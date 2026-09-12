import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors.js';

export const validateRequest = (schema: ZodSchema) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issueMessages = error.issues.map(
          (issue) => `${issue.path.join('.')}: ${issue.message}`
        );
        next(new ValidationError('Validation Error', issueMessages));
      } else {
        next(error);
      }
    }
  };
};
