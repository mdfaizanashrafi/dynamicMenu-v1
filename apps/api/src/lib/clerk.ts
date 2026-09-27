import { createClerkClient, verifyToken } from "@clerk/backend";
import { env } from "../config/env.js";
import { ApiError } from "../utils/api-error.js";

export interface AuthIdentity {
  clerkId: string;
  email: string;
  name: string | null;
}

const clerk = env.CLERK_SECRET_KEY
  ? createClerkClient({ secretKey: env.CLERK_SECRET_KEY })
  : null;

/**
 * Verify a Clerk session token and return the identity to sync into our DB.
 * Throws ApiError(401) for any invalid/expired/absent token.
 */
export async function verifyClerkToken(token: string): Promise<AuthIdentity> {
  if (!clerk) {
    throw new ApiError(
      401,
      "AUTH_NOT_CONFIGURED",
      "Authentication is not configured on the server."
    );
  }

  try {
    const payload = await verifyToken(token, {
      secretKey: env.CLERK_SECRET_KEY!,
    });
    const user = payload.sub
      ? await clerk.users.getUser(payload.sub)
      : null;

    const email =
      user?.primaryEmailAddress?.emailAddress ??
      user?.emailAddresses[0]?.emailAddress ??
      "";
    if (!payload.sub || !email) {
      throw new ApiError(
        401,
        "AUTH_INVALID_TOKEN",
        "The session token is invalid."
      );
    }

    return {
      clerkId: payload.sub,
      email,
      name:
        user?.fullName ??
        [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
        null,
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      401,
      "AUTH_INVALID_TOKEN",
      "The session token is invalid or expired."
    );
  }
}
