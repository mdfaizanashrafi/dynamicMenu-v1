import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/api-error.js";
import { getAccountForCustomer } from "../loyalty/loyalty.service.js";
import { reviewRedirectUrl } from "../../integrations/google-maps.js";
import type { SubmitReviewInput } from "./reviews.schemas.js";

export interface ReviewDto {
  id: string;
  rating: number;
  comment: string | null;
  googleMapsOpenedAt: string | null;
  createdAt: string;
}

export interface CustomerOrderStatus {
  id: string;
  status: string;
  total: number;
  table: { label: string };
  restaurant: { name: string; googleMapsUrl: string | null };
  reviewEligible: boolean;
  review: ReviewDto | null;
  loyalty: { points: number } | null;
}

const REVIEW_ELIGIBLE_STATUSES = ["PAID", "COMPLETED"] as const;

async function resolveOrderForToken(token: string, orderId: string) {
  const table = await prisma.restaurantTable.findFirst({
    where: { qrToken: token, isActive: true },
    include: {
      restaurant: { select: { id: true, name: true, googleMapsUrl: true } },
    },
  });
  if (!table) {
    throw new ApiError(
      404,
      "INVALID_QR",
      "This QR code is unavailable. Please ask restaurant staff for a new QR code."
    );
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, tableId: table.id },
    include: { review: true },
  });
  if (!order) {
    throw new ApiError(404, "ORDER_NOT_FOUND", "The requested order could not be found.");
  }

  return { table, order };
}

function toReviewDto(review: {
  id: string;
  rating: number;
  comment: string | null;
  googleMapsOpenedAt: Date | null;
  createdAt: Date;
}): ReviewDto {
  return {
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    googleMapsOpenedAt: review.googleMapsOpenedAt?.toISOString() ?? null,
    createdAt: review.createdAt.toISOString(),
  };
}

/** Public order status for the customer who placed it (token → table → order). */
export async function getCustomerOrderStatus(
  token: string,
  orderId: string
): Promise<CustomerOrderStatus> {
  const { table, order } = await resolveOrderForToken(token, orderId);
  const loyalty = order.customerId
    ? await getAccountForCustomer(order.customerId)
    : null;
  return {
    id: order.id,
    status: order.status,
    total: order.total.toNumber(),
    table: { label: table.label },
    restaurant: table.restaurant,
    reviewEligible: (REVIEW_ELIGIBLE_STATUSES as readonly string[]).includes(order.status),
    review: order.review ? toReviewDto(order.review) : null,
    loyalty: loyalty ? { points: loyalty.points } : null,
  };
}

/**
 * Submit (or update) the in-app review for a paid order. One review per
 * order; upsert keeps retries idempotent. Google review posting can never
 * be claimed — this stores only the feedback the customer gives us.
 */
export async function submitReview(
  token: string,
  orderId: string,
  input: SubmitReviewInput
): Promise<ReviewDto> {
  const { order } = await resolveOrderForToken(token, orderId);
  if (!(REVIEW_ELIGIBLE_STATUSES as readonly string[]).includes(order.status)) {
    throw new ApiError(
      400,
      "REVIEW_NOT_ELIGIBLE",
      "You can leave a review after the restaurant marks your order as paid."
    );
  }

  const review = await prisma.review.upsert({
    where: { orderId: order.id },
    create: {
      orderId: order.id,
      restaurantId: order.restaurantId,
      rating: input.rating,
      comment: input.comment ?? null,
    },
    update: {
      rating: input.rating,
      comment: input.comment ?? null,
    },
  });

  return toReviewDto(review);
}

/**
 * Record that the customer opened the restaurant's Google Maps review link.
 * This only proves the redirect happened — never that a review was posted.
 */
export async function recordGoogleMapsOpen(token: string, orderId: string) {
  const { table, order } = await resolveOrderForToken(token, orderId);
  if (!order.review) {
    throw new ApiError(
      400,
      "REVIEW_NOT_SUBMITTED",
      "Please submit your feedback before opening the Google review link."
    );
  }

  const updated = await prisma.review.update({
    where: { id: order.review.id },
    data: { googleMapsOpenedAt: order.review.googleMapsOpenedAt ?? new Date() },
  });

  return {
    review: toReviewDto(updated),
    // Hardened by the Google Maps integration: only Google-owned hosts.
    googleMapsUrl: reviewRedirectUrl(table.restaurant.googleMapsUrl),
  };
}
