-- AlterTable
ALTER TABLE "OneTimeOrder" ADD COLUMN     "customerId" TEXT,
ADD COLUMN     "unit" TEXT NOT NULL DEFAULT 'L';

-- AlterTable
ALTER TABLE "Setting" ADD COLUMN     "defaultChaiPricePerCup" DOUBLE PRECISION NOT NULL DEFAULT 10;

-- CreateIndex
CREATE INDEX "OneTimeOrder_customerId_idx" ON "OneTimeOrder"("customerId");

-- AddForeignKey
ALTER TABLE "OneTimeOrder" ADD CONSTRAINT "OneTimeOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
