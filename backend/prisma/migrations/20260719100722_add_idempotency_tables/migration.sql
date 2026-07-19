/*
  Warnings:

  - Added the required column `expiresAt` to the `Idempotency` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Idempotency` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Idempotency" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "lastError" TEXT,
ADD COLUMN     "processingStartedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
