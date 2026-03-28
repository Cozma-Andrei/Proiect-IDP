import { Request, Response, NextFunction } from 'express';
import { ValidationError } from 'joi';
import {
  ResourceConflictError,
  ResourceNotFoundError,
  ResourceInvalidError,
} from './errors';

function parseJoiValidationErrors(err: ValidationError["details"]) {
  return err.reduce((accumulator: Record<string, string[]>, current) => {
    const field = current.context?.key || 'unknown';
    if (!accumulator[field]) accumulator[field] = [];
    accumulator[field].push(current.message);
    return accumulator;
  }, {});
}

export const errorHandler = (
  e: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (e instanceof ValidationError) {
    res.status(400).send(parseJoiValidationErrors(e.details));
  } else if (e instanceof ResourceConflictError) {
    res.status(409).send({ message: e.message });
  } else if (e instanceof ResourceNotFoundError) {
    res.status(404).send({ message: e.message });
  } else if (e instanceof ResourceInvalidError) {
    res.status(400).send({ message: e.message });
  } else {
    console.error(e);
    res.status(500).send({ message: e.message });
  }
};
