-- DropForeignKey
ALTER TABLE "public"."Inventory" DROP CONSTRAINT "Inventory_entryId_fkey";

-- AlterTable
ALTER TABLE "Inventory" ADD COLUMN     "providerId" TEXT,
ALTER COLUMN "entryId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "Entry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE SET NULL ON UPDATE CASCADE;
