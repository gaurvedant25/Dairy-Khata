-- AlterTable
ALTER TABLE "Setting" ADD COLUMN     "starredProducts" TEXT[] DEFAULT ARRAY[]::TEXT[];
