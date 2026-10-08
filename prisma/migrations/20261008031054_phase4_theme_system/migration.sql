-- CreateTable
CREATE TABLE "RestaurantTheme" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "draftConfig" JSONB,
    "publishedConfig" JSONB,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RestaurantTheme_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantTheme_restaurantId_key" ON "RestaurantTheme"("restaurantId");

-- AddForeignKey
ALTER TABLE "RestaurantTheme" ADD CONSTRAINT "RestaurantTheme_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
