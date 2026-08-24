-- AlterTable
ALTER TABLE "DeliveryEntry" ADD COLUMN     "product" TEXT NOT NULL DEFAULT 'Milk',
ADD COLUMN     "unit" TEXT NOT NULL DEFAULT 'L';
