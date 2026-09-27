import type { NextFunction, Request, RequestHandler, Response } from "express";

/** Wrap async route handlers so rejections reach the error middleware. */
export const asyncHandler =
  (handler: RequestHandler): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
