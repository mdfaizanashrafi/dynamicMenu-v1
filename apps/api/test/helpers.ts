import type { AuthVerifier } from "../src/modules/auth/auth.middleware.js";

/**
 * Test verifier: the bearer token is the Clerk ID itself. Simulates Clerk
 * verification without network calls; the middleware still runs the real
 * user-sync and authorization path against the test database.
 */
export function createStubVerifier(): AuthVerifier {
  return async (token) => {
    if (token.startsWith("clerk_")) {
      return {
        clerkId: token,
        email: `${token}@test.com`,
        name: token,
      };
    }
    throw new Error("invalid token");
  };
}

export function authHeader(clerkId: string): Record<string, string> {
  return { Authorization: `Bearer ${clerkId}` };
}
