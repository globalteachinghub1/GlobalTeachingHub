-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "outcomes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "priceNote" TEXT;

-- AlterTable
ALTER TABLE "CourseTranslation" ADD COLUMN     "outcomes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "priceNote" TEXT;
