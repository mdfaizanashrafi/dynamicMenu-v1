/*
  Warnings:

  - Added the required column `subtotal` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OfferDiscountType" AS ENUM ('PERCENT', 'FLAT');

-- AlterTable
ALTER TABLE "Offer" ADD COLUMN     "discountType" "OfferDiscountType",
ADD COLUMN     "discountValue" DECIMAL(10,2),
ADD COLUMN     "endsAt" TIMESTAMP(3),
ADD COLUMN     "startsAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "offerId" TEXT,
ADD COLUMN     "subtotal" DECIMAL(10,2);

-- Backfill subtotal from total for existing orders
UPDATE "Order" SET "subtotal" = "total" WHERE "subtotal" IS NULL;

-- Make subtotal required after backfill
ALTER TABLE "Order" ALTER COLUMN "subtotal" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
