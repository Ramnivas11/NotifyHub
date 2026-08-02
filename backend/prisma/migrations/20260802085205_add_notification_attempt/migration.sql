/*
  Warnings:

  - Added the required column `preferredProvider` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('PROCESSING', 'SUCCESS', 'FAILED');

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "preferredProvider" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "NotificationAttempt" (
    "id" SERIAL NOT NULL,
    "notificationId" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "status" "AttemptStatus" NOT NULL,
    "providerMessageId" TEXT,
    "latency" INTEGER,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NotificationAttempt_notificationId_idx" ON "NotificationAttempt"("notificationId");

-- CreateIndex
CREATE INDEX "NotificationAttempt_status_updatedAt_idx" ON "NotificationAttempt"("status", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationAttempt_notificationId_attemptNumber_key" ON "NotificationAttempt"("notificationId", "attemptNumber");

-- AddForeignKey
ALTER TABLE "NotificationAttempt" ADD CONSTRAINT "NotificationAttempt_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
