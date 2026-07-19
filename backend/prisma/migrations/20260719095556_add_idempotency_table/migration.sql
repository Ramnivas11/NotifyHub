-- CreateTable
CREATE TABLE "Idempotency" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "response" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notificationId" INTEGER,

    CONSTRAINT "Idempotency_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Idempotency_key_key" ON "Idempotency"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Idempotency_notificationId_key" ON "Idempotency"("notificationId");

-- AddForeignKey
ALTER TABLE "Idempotency" ADD CONSTRAINT "Idempotency_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE SET NULL ON UPDATE CASCADE;
