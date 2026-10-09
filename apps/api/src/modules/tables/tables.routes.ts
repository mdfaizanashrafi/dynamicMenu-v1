import { Router } from "express";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import { z } from "zod";
import { requireMembership } from "../../middleware/authorization.js";
import { validate } from "../../middleware/validate.js";
import { ApiError } from "../../utils/api-error.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { prisma } from "../../lib/prisma.js";
import { createTable, deleteTable, listTables, updateTable } from "./tables.service.js";
import { createTableSchema, updateTableSchema } from "./tables.schemas.js";

const tableParams = z.object({ tableId: z.string().min(1) });

/** Resolve a table id within the tenant, without leaking other tenants. */
const requireTable: RequestHandler = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const { restaurantId, tableId } = req.params as {
      restaurantId?: string;
      tableId?: string;
    };
    const table = await prisma.restaurantTable.findFirst({
      where: { id: tableId ?? "", restaurantId: restaurantId ?? "" },
    });
    if (!table) {
      throw new ApiError(404, "TABLE_NOT_FOUND", "The table could not be found.");
    }
    next();
  }
);

export function createTablesRouter(requireAuth: RequestHandler): Router {
  // mergeParams: mounted under /restaurants/:restaurantId/tables.
  const router = Router({ mergeParams: true });

  router.use(requireAuth, requireMembership("MANAGER"));

  router.get(
    "/",
    asyncHandler(async (req: Request, res: Response) => {
      const { restaurantId } = req.params as { restaurantId: string };
      res.json({ success: true, data: await listTables(restaurantId) });
    })
  );

  router.post(
    "/",
    validate({ body: createTableSchema }),
    asyncHandler(async (req: Request, res: Response) => {
      const { restaurantId } = req.params as { restaurantId: string };
      const table = await createTable(restaurantId, req.body);
      res.status(201).json({ success: true, data: table });
    })
  );

  router.patch(
    "/:tableId",
    requireTable,
    validate({ body: updateTableSchema, params: tableParams }),
    asyncHandler(async (req: Request, res: Response) => {
      const { tableId } = req.params as { tableId: string };
      const table = await updateTable(tableId, req.body);
      res.json({ success: true, data: table });
    })
  );

  router.delete(
    "/:tableId",
    requireTable,
    asyncHandler(async (req: Request, res: Response) => {
      const { tableId } = req.params as { tableId: string };
      await deleteTable(tableId);
      res.json({ success: true, data: { deleted: true } });
    })
  );

  return router;
}
