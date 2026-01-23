-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- Insert default user for existing data (password: admin123 hashed with bcrypt)
INSERT INTO "users" ("id", "email", "password", "name", "createdAt", "updatedAt")
VALUES ('default-user-id', 'admin@fincontrol.com', '$2a$10$rqV5VJPUlZN5v5rWOvJxOe5q7f5l5f5f5f5f5f5f5f5f5f5f5f5f5f', 'Admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Add userId columns (nullable first)
ALTER TABLE "transactions" ADD COLUMN "userId" TEXT;
ALTER TABLE "investments" ADD COLUMN "userId" TEXT;
ALTER TABLE "credit_cards" ADD COLUMN "userId" TEXT;
ALTER TABLE "budgets" ADD COLUMN "userId" TEXT;
ALTER TABLE "recurring_expenses" ADD COLUMN "userId" TEXT;
ALTER TABLE "financial_goals" ADD COLUMN "userId" TEXT;

-- Update existing data to reference default user
UPDATE "transactions" SET "userId" = 'default-user-id' WHERE "userId" IS NULL;
UPDATE "investments" SET "userId" = 'default-user-id' WHERE "userId" IS NULL;
UPDATE "credit_cards" SET "userId" = 'default-user-id' WHERE "userId" IS NULL;
UPDATE "budgets" SET "userId" = 'default-user-id' WHERE "userId" IS NULL;
UPDATE "recurring_expenses" SET "userId" = 'default-user-id' WHERE "userId" IS NULL;
UPDATE "financial_goals" SET "userId" = 'default-user-id' WHERE "userId" IS NULL;

-- Make userId columns NOT NULL
ALTER TABLE "transactions" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "investments" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "credit_cards" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "budgets" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "recurring_expenses" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "financial_goals" ALTER COLUMN "userId" SET NOT NULL;

-- Drop old unique constraint on budgets
ALTER TABLE "budgets" DROP CONSTRAINT IF EXISTS "budgets_category_month_year_key";

-- Add new unique constraint with userId
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_category_month_year_userId_key" UNIQUE ("category", "month", "year", "userId");

-- Add foreign keys
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "investments" ADD CONSTRAINT "investments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recurring_expenses" ADD CONSTRAINT "recurring_expenses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "financial_goals" ADD CONSTRAINT "financial_goals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
