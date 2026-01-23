-- AlterTable
ALTER TABLE "investments" ADD COLUMN     "goalValue" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "operations" ALTER COLUMN "quantity" SET DEFAULT 0,
ALTER COLUMN "price" SET DEFAULT 0;
