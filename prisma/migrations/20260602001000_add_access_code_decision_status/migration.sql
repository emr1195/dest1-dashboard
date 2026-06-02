ALTER TABLE "AccessCode"
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN "decisionToken" TEXT,
ADD COLUMN "decidedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "AccessCode_decisionToken_key" ON "AccessCode"("decisionToken");
