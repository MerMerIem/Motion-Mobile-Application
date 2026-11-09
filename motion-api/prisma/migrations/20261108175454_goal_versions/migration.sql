/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `goals` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "goals_userId_key";

-- AlterTable
ALTER TABLE "goals" DROP COLUMN "updatedAt";

-- CreateIndex
CREATE INDEX "goals_userId_createdAt_idx" ON "goals"("userId", "createdAt");
