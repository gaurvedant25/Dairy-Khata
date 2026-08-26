-- AlterTable
ALTER TABLE "User" ADD COLUMN     "razorpaySubscriptionId" TEXT,
ADD COLUMN     "subscriptionStatus" TEXT;

-- CreateTable
CREATE TABLE "ProcessedPayment" (
    "paymentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessedPayment_pkey" PRIMARY KEY ("paymentId")
);
