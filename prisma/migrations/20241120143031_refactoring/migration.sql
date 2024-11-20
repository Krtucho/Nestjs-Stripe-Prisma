/*
  Warnings:

  - You are about to drop the column `paymentId` on the `PaymentMethod` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "PaymentMethod" DROP CONSTRAINT "PaymentMethod_paymentId_fkey";

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "paymentMethodId" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "PaymentMethod" DROP COLUMN "paymentId";

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
