/*
  Warnings:

  - You are about to drop the column `battleId` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the column `elo` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `lastSolvedAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `streak` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Battle` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BeatAttempt` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CommunityPost` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Notification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SkillProfile` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "GenerationStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SubmissionStatus" ADD VALUE 'MEMORY_LIMIT_EXCEEDED';
ALTER TYPE "SubmissionStatus" ADD VALUE 'INTERNAL_ERROR';

-- DropForeignKey
ALTER TABLE "AIFeedback" DROP CONSTRAINT "AIFeedback_submissionId_fkey";

-- DropForeignKey
ALTER TABLE "Battle" DROP CONSTRAINT "Battle_problemId_fkey";

-- DropForeignKey
ALTER TABLE "Battle" DROP CONSTRAINT "Battle_userAId_fkey";

-- DropForeignKey
ALTER TABLE "Battle" DROP CONSTRAINT "Battle_userBId_fkey";

-- DropForeignKey
ALTER TABLE "BeatAttempt" DROP CONSTRAINT "BeatAttempt_postId_fkey";

-- DropForeignKey
ALTER TABLE "BeatAttempt" DROP CONSTRAINT "BeatAttempt_userId_fkey";

-- DropForeignKey
ALTER TABLE "CommunityPost" DROP CONSTRAINT "CommunityPost_problemId_fkey";

-- DropForeignKey
ALTER TABLE "CommunityPost" DROP CONSTRAINT "CommunityPost_userId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- DropForeignKey
ALTER TABLE "SkillProfile" DROP CONSTRAINT "SkillProfile_userId_fkey";

-- DropForeignKey
ALTER TABLE "Submission" DROP CONSTRAINT "Submission_battleId_fkey";

-- DropForeignKey
ALTER TABLE "Submission" DROP CONSTRAINT "Submission_problemId_fkey";

-- DropForeignKey
ALTER TABLE "TestCase" DROP CONSTRAINT "TestCase_problemId_fkey";

-- AlterTable
ALTER TABLE "ChatMessage" ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "Submission" DROP COLUMN "battleId",
ADD COLUMN     "results" JSONB;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "elo",
DROP COLUMN "lastSolvedAt",
DROP COLUMN "streak",
ADD COLUMN     "profilePic" TEXT;

-- DropTable
DROP TABLE "Battle";

-- DropTable
DROP TABLE "BeatAttempt";

-- DropTable
DROP TABLE "CommunityPost";

-- DropTable
DROP TABLE "Notification";

-- DropTable
DROP TABLE "SkillProfile";

-- DropEnum
DROP TYPE "BattleStatus";

-- DropEnum
DROP TYPE "NotificationType";

-- DropEnum
DROP TYPE "SkillLevel";

-- CreateTable
CREATE TABLE "ProblemGeneration" (
    "id" TEXT NOT NULL,
    "status" "GenerationStatus" NOT NULL DEFAULT 'PENDING',
    "difficulty" "Difficulty" NOT NULL,
    "language" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "problemId" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProblemGeneration_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestCase" ADD CONSTRAINT "TestCase_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIFeedback" ADD CONSTRAINT "AIFeedback_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemGeneration" ADD CONSTRAINT "ProblemGeneration_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemGeneration" ADD CONSTRAINT "ProblemGeneration_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
