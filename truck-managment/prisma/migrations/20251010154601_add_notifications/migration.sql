-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NEW_PROVIDER', 'NEW_TRUCK', 'NEW_ENTRY', 'NEW_LOAD', 'NEW_INVENTORY');

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "message" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserNotificationPreferences" (
    "userId" TEXT NOT NULL,
    "newProvider" BOOLEAN NOT NULL DEFAULT true,
    "newTruck" BOOLEAN NOT NULL DEFAULT true,
    "newEntry" BOOLEAN NOT NULL DEFAULT true,
    "newLoad" BOOLEAN NOT NULL DEFAULT true,
    "newInventory" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UserNotificationPreferences_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserNotificationPreferences" ADD CONSTRAINT "UserNotificationPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
