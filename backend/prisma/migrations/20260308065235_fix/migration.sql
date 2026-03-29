/*
  Warnings:

  - You are about to drop the column `slug` on the `Problem` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Problem_slug_key";

-- AlterTable
ALTER TABLE "Problem" DROP COLUMN "slug",
ADD COLUMN     "generatedByAI" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "topic" TEXT;
