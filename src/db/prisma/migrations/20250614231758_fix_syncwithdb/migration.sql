/*
  Warnings:

  - The `syncWithDb` column on the `user_settings` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "user_settings" DROP COLUMN "syncWithDb",
ADD COLUMN     "syncWithDb" BOOLEAN NOT NULL DEFAULT true;
