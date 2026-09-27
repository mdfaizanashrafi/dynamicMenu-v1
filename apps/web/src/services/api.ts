import { env } from "../config/env";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

/** Minimal typed fetch wrapper for the DynamicMenu API. */
export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${env.apiBaseUrl}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });

  const body = (await res.json()) as ApiResponse<T>;

  if (!res.ok || body.success === false) {
    throw new Error(body.error?.message ?? "Request failed.");
  }

  return body.data as T;
}
