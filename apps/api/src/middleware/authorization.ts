import type { Role } from "@prisma/client";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../utils/api-error.js";
import { roleAtLeast } from "../utils/roles.js";

/**
 * Resolve tenant context for :restaurantId routes.
 *
 * The client never supplies tenant identity as a trusted value — the
 * membership is looked up server-side from the authenticated user.
 * Non-members get 404 (not 403) so restaurant existence is not leaked.
 */
export const requireMembership = (
  minimumRole: Role = "STAFF"
): RequestHandler => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const { restaurantId } = req.params as { restaurantId?: string };
      const user = req.user;

      if (!user) {
        throw new ApiError(
          401,
          "AUTH_REQUIRED",
          "Authentication credentials are missing."
        );
      }
      if (!restaurantId) {
        throw new ApiError(
          400,
          "VALIDATION_ERROR",
          "A restaurant id is required."
        );
      }

      let membership = await prisma.restaurantMembership.findUnique({
        where: {
          userId_restaurantId: { userId: user.id, restaurantId },
        },
        include: { restaurant: true },
      });

      // Phase 15 — multi-branch: members of a branch's parent restaurant
      // inherit the same access to the branch (staff access across branches).
      if (!membership) {
        const branch = await prisma.restaurant.findUnique({
          where: { id: restaurantId },
          select: { parentId: true },
        });
        if (branch?.parentId) {
          const parentMembership = await prisma.restaurantMembership.findUnique({
            where: {
              userId_restaurantId: { userId: user.id, restaurantId: branch.parentId },
            },
            include: { restaurant: true },
          });
          if (parentMembership) {
            const branchRestaurant = await prisma.restaurant.findUnique({
              where: { id: restaurantId },
            });
            membership = { ...parentMembership, restaurant: branchRestaurant! };
          }
        }
      }

      if (!membership) {
        throw new ApiError(
          404,
          "RESTAURANT_NOT_FOUND",
          "The requested restaurant could not be found."
        );
      }

      if (!roleAtLeast(membership.role, minimumRole)) {
        throw new ApiError(
          403,
          "FORBIDDEN",
          "Your role does not allow this action."
        );
      }

      req.membership = membership;
      next();
    } catch (error) {
      next(error);
    }
  };
};
