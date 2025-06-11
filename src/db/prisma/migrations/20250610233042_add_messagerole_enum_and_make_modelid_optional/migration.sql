/*
  Warnings:

  - Added the required column `role` to the `messages` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('user', 'assistant');

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "role" "MessageRole" NOT NULL,
ALTER COLUMN "modelId" DROP NOT NULL;
