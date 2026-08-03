-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "resolutionNotes" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "suspendedAt" TIMESTAMP(3);
