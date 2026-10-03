import type { NextFunction, Request, Response } from "express";
import { MulterError } from "multer";
import { ZodError } from "zod";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { ApiError } from "../utils/api-error.js";

interface ErrorBody {
  success: false;
  error: { code: string; message: string };
}

/** Consistent public error shape per ARCHITECTURE.md §33. Never leaks internals. */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message },
    } satisfies ErrorBody);
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed.",
      },
    } satisfies ErrorBody);
    return;
  }

  if (err instanceof MulterError) {
    res.status(400).json({
      success: false,
      error: {
        code: err.code === "LIMIT_FILE_SIZE" ? "FILE_TOO_LARGE" : "INVALID_FILE",
        message:
          err.code === "LIMIT_FILE_SIZE"
            ? "The file exceeds the 2 MB size limit."
            : "The uploaded file could not be processed.",
      },
    } satisfies ErrorBody);
    return;
  }

  logger.error(
    { err, method: req.method, url: req.originalUrl },
    "Unhandled request error"
  );

  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message:
        env.NODE_ENV === "production"
          ? "An unexpected error occurred."
          : err instanceof Error
            ? err.message
            : "An unexpected error occurred.",
    },
  } satisfies ErrorBody);
}
