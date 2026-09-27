import type { User } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import type { AuthIdentity } from "../../lib/clerk.js";

/**
 * Ensure a local User exists for the Clerk identity.
 * First sign-in creates the record; later sign-ins refresh name/email.
 */
export async function syncUser(identity: AuthIdentity): Promise<User> {
  return prisma.user.upsert({
    where: { clerkId: identity.clerkId },
    update: { email: identity.email, name: identity.name },
    create: {
      clerkId: identity.clerkId,
      email: identity.email,
      name: identity.name,
    },
  });
}
