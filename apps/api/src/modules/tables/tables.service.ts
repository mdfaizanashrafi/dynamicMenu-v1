import { randomBytes } from "node:crypto";
import { prisma } from "../../lib/prisma.js";
import { env } from "../../config/env.js";
import type { CreateTableInput, UpdateTableInput } from "./tables.schemas.js";

/**
 * Unguessable URL-safe token identifying table + restaurant publicly
 * (ARCHITECTURE.md §9). Never expose internal ids in QR URLs.
 */
function generateQrToken(): string {
  return randomBytes(18).toString("base64url");
}

function menuUrl(qrToken: string): string {
  return `${env.WEB_BASE_URL}/q/${qrToken}`;
}

async function createWithUniqueToken(restaurantId: string, label: string) {
  // Retry on the (astronomically rare) token collision.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const table = await prisma.restaurantTable.create({
        data: { restaurantId, label, qrToken: generateQrToken() },
      });
      return { ...table, menuUrl: menuUrl(table.qrToken) };
    } catch (error) {
      const isCollision =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: string }).code === "P2002";
      if (!isCollision || attempt === 2) throw error;
    }
  }
  throw new Error("unreachable");
}

export function createTable(restaurantId: string, input: CreateTableInput) {
  return createWithUniqueToken(restaurantId, input.label);
}

export async function listTables(restaurantId: string) {
  const tables = await prisma.restaurantTable.findMany({
    where: { restaurantId },
    orderBy: { createdAt: "asc" },
  });
  return tables.map((t) => ({ ...t, menuUrl: menuUrl(t.qrToken) }));
}

export async function updateTable(tableId: string, input: UpdateTableInput) {
  const { label, isActive, rotateToken } = input;
  const table = await prisma.restaurantTable.update({
    where: { id: tableId },
    data: {
      ...(label !== undefined ? { label } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(rotateToken ? { qrToken: generateQrToken() } : {}),
    },
  });
  return { ...table, menuUrl: menuUrl(table.qrToken) };
}

export function deleteTable(tableId: string) {
  return prisma.restaurantTable.delete({ where: { id: tableId } });
}
