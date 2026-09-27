import type { NextFunction, Request, RequestHandler, Response } from "express";
import { env } from "../../config/env.js";
import { verifyClerkToken, type AuthIdentity } from "../../lib/clerk.js";
import { ApiError } from "../../utils/api-error.js";
import { syncUser } from "./auth.service.js";

export type AuthVerifier = (token: string) => Promise<AuthIdentity>;

const DEV_AUTH_ENABLED =
  env.ENABLE_DEV_AUTH === true && env.NODE_ENV !== "production";

/**
 * Local-development bypass when Clerk keys are unavailable.
 * Trusts `x-dev-clerk-id` + `x-dev-email` headers so the tenant flow can be
 * exercised locally. Never active when a Clerk secret key is configured or
 * in production.
 */
async function devVerifier(req: Request): Promise<AuthIdentity> {
  const clerkId = req.header("x-dev-clerk-id");
  const email = req.header("x-dev-email");
  if (!clerkId || !email) {
    throw new ApiError(
      401,
      "AUTH_REQUIRED",
      "Authentication credentials are missing."
    );
  }
  return { clerkId, email, name: req.header("x-dev-name") ?? null };
}

/**
 * Require a valid session. Verifies the Clerk JWT by default; tests inject a
 * verifier via createRequireAuth, and local dev uses the header bypass below.
 */
export function createRequireAuth(verifier?: AuthVerifier): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const identity = DEV_AUTH_ENABLED
        ? await devVerifier(req)
        : await (verifier ?? verifyClerkToken)(extractBearer(req));

      req.user = await syncUser(identity);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export const requireAuth = createRequireAuth();

function extractBearer(req: Request): string {
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer ")) {
    throw new ApiError(
      401,
      "AUTH_REQUIRED",
      "Authentication credentials are missing."
    );
  }
  return header.slice("Bearer ".length);
}
