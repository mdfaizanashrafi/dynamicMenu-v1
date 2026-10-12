-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "parentId" TEXT;

-- CreateIndex
CREATE INDEX "Restaurant_parentId_idx" ON "Restaurant"("parentId");

-- AddForeignKey
ALTER TABLE "Restaurant" ADD CONSTRAINT "Restaurant_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Restaurant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
