/**
 * Application error with a stable public code and HTTP status.
 * `message` is safe to show to API consumers; internals stay out.
 */
export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const notFound = (code: string, message: string) =>
  new ApiError(404, code, message);
