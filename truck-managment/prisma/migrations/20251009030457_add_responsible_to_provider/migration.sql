-- AlterTable
ALTER TABLE "Provider" ADD COLUMN     "responsibleId" TEXT;

-- AddForeignKey
ALTER TABLE "Provider" ADD CONSTRAINT "Provider_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
