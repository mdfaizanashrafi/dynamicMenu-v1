-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'STARTER', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELLED');

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "plan" "Plan" NOT NULL DEFAULT 'FREE',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_restaurantId_key" ON "Subscription"("restaurantId");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: every existing restaurant starts on the FREE plan
INSERT INTO "Subscription" ("id", "restaurantId", "plan", "status", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, r."id", 'FREE', 'ACTIVE', NOW(), NOW()
FROM "Restaurant" r
WHERE NOT EXISTS (SELECT 1 FROM "Subscription" s WHERE s."restaurantId" = r."id");
