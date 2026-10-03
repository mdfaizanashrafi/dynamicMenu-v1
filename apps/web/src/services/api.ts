import { env } from "../config/env";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Typed fetch wrapper for the DynamicMenu API (ARCHITECTURE.md §33 shape). */
export async function apiFetch<T>(
  path: string,
  init?: RequestInit & { token?: string | null }
): Promise<T> {
  const { token, headers, ...rest } = init ?? {};
  const isFormData = init?.body instanceof FormData;
  const res = await fetch(`${env.apiBaseUrl}${path}`, {
    headers: {
      // FormData must not carry a manual Content-Type (browser sets the
      // multipart boundary); JSON requests get it explicitly.
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...rest,
  });

  const body = (await res.json().catch(() => null)) as ApiResponse<T> | null;

  if (!res.ok || !body || body.success === false) {
    throw new ApiError(
      body?.error?.code ?? "REQUEST_FAILED",
      body?.error?.message ?? "Request failed.",
      res.status
    );
  }

  return body.data as T;
}
