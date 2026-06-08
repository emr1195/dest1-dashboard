ALTER TABLE "FinanceTransaction"
ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'Sin categoria';
