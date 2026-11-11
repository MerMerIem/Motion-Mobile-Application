-- AlterEnum
ALTER TYPE "FeedbackType" ADD VALUE 'not_helpful';

-- AlterTable
ALTER TABLE "recommendations" ADD COLUMN     "highlights" JSONB,
ADD COLUMN     "summary" TEXT,
ADD COLUMN     "title" TEXT;
