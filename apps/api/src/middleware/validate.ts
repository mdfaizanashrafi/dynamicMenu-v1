import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ZodType } from "zod";

interface Schemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

/** Validate request parts against zod schemas; replaces them with parsed data. */
export const validate =
  (schemas: Schemas): RequestHandler =>
  (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query) req.query = schemas.query.parse(req.query) as Request["query"];
      if (schemas.params) req.params = schemas.params.parse(req.params) as Request["params"];
      next();
    } catch (error) {
      next(error);
    }
  };
