-- CreateTable
CREATE TABLE "NotificationTranslation" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationTranslation_notificationId_locale_key" ON "NotificationTranslation"("notificationId", "locale");

-- AddForeignKey
ALTER TABLE "NotificationTranslation" ADD CONSTRAINT "NotificationTranslation_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
