-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "blockId" TEXT,
ADD COLUMN     "phaseId" TEXT,
ADD COLUMN     "societyId" TEXT;

-- CreateTable
CREATE TABLE "Society" (
    "id" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Society_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Phase" (
    "id" TEXT NOT NULL,
    "societyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Phase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Block" (
    "id" TEXT NOT NULL,
    "phaseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Society_city_idx" ON "Society"("city");

-- CreateIndex
CREATE UNIQUE INDEX "Society_city_name_key" ON "Society"("city", "name");

-- CreateIndex
CREATE INDEX "Phase_societyId_idx" ON "Phase"("societyId");

-- CreateIndex
CREATE UNIQUE INDEX "Phase_societyId_name_key" ON "Phase"("societyId", "name");

-- CreateIndex
CREATE INDEX "Block_phaseId_idx" ON "Block"("phaseId");

-- CreateIndex
CREATE UNIQUE INDEX "Block_phaseId_name_key" ON "Block"("phaseId", "name");

-- CreateIndex
CREATE INDEX "Listing_phaseId_idx" ON "Listing"("phaseId");

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_societyId_fkey" FOREIGN KEY ("societyId") REFERENCES "Society"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "Phase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "Block"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Phase" ADD CONSTRAINT "Phase_societyId_fkey" FOREIGN KEY ("societyId") REFERENCES "Society"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "Phase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
