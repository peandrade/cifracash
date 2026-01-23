/*
  Warnings:

  - Made the column `month` on table `budgets` required. This step will fail if there are existing NULL values in that column.
  - Made the column `year` on table `budgets` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "budgets" ALTER COLUMN "month" SET NOT NULL,
ALTER COLUMN "month" SET DEFAULT 0,
ALTER COLUMN "year" SET NOT NULL,
ALTER COLUMN "year" SET DEFAULT 0;
