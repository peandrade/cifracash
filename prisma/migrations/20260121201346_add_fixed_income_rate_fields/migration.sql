-- AlterTable
ALTER TABLE "investments" ADD COLUMN     "indexer" TEXT,
ADD COLUMN     "interestRate" DOUBLE PRECISION,
ADD COLUMN     "maturityDate" TIMESTAMP(3);
