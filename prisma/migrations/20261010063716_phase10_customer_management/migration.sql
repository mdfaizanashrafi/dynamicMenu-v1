-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "customerId" TEXT;

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Customer_restaurantId_idx" ON "Customer"("restaurantId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_restaurantId_phone_key" ON "Customer"("restaurantId", "phone");

-- CreateIndex
CREATE INDEX "Order_customerId_idx" ON "Order"("customerId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill customer profiles from existing orders (phone = identity within a restaurant)
INSERT INTO "Customer" ("id", "restaurantId", "name", "phone", "email", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text,
       o."restaurantId",
       MAX(o."customerName"),
       o."customerPhone",
       MAX(o."customerEmail"),
       MIN(o."createdAt"),
       NOW()
FROM "Order" o
WHERE o."customerPhone" IS NOT NULL
GROUP BY o."restaurantId", o."customerPhone"
ON CONFLICT ("restaurantId", "phone") DO NOTHING;

UPDATE "Order" o
SET "customerId" = c."id"
FROM "Customer" c
WHERE c."restaurantId" = o."restaurantId"
  AND c."phone" = o."customerPhone";
